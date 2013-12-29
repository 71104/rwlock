/**
 * Asynchronous read/write lock implementation for Node.
 *
 * The rules:
 * - there may be zero or more readers at the same time,
 * - there may be only one writer at a time,
 * - if there is a writer there may be no readers.
 *
 * ReadWriteLock also supports multiple independent locks identified by custom
 * user-defined strings called "keys".
 *
 * @class ReadWriteLock
 * @constructor
 */
module.exports = function () {
	'use strict';

	function Lock() {
		this.readers = 0;
		this.queue = [];
	}

	var defaultLock = new Lock();
	var table = {};

	/**
	 * Acquires a read lock and invokes a user-defined callback as soon as it is
	 * acquired.
	 *
	 * The operation might require some time as there may be a writer. You can
	 * optionally specify a timeout in milliseconds: if it expires before a read
	 * lock can be acquired, this request is canceled and no lock will be
	 * acquired.
	 *
	 * The `key` argument allows you to work on a specific lock; omitting it
	 * will request the default lock.
	 *
	 * @method readLock
	 * @param [key] {String} The name of the lock to read-acquire. The default
	 * lock will be requested if no key is specified.
	 * @param callback {Function} A user-defined function invoked as soon as a
	 * read lock is acquired.
	 * @param callback.release {Function} A function that releases the lock.
	 *
	 * This must be called by the ReadWriteLock user at some point, otherwise
	 * the read lock will remain and prevent any writers from operating. Anyway
	 * you do not necessarily need to call it inside the `callback` function:
	 * you can save a reference to the `release` function and call it later.
	 * @param [options] {Object} Further optional settings.
	 * @param [options.scope] {Object} An optional object to use as `this` when
	 * calling the `callback` function.
	 * @param [options.timeout] {Number} A timeout in milliseconds within which
	 * the lock must be acquired; if a writer is still operating and the timeout
	 * expires the request is canceled and no lock is acquired.
	 * @param [options.timeoutCallback] {Function} An optional user-defined
	 * callback function that gets invokes in case the timeout expires before
	 * the lock can be acquired.
	 */
	function readLock(key, callback, options) {
		var lock;
		if (typeof key !== 'function') {
			if (!table.hasOwnProperty(key)) {
				table[key] = new Lock();
			}
			lock = table[key];
		} else {
			options = callback;
			callback = key;
			lock = defaultLock;
		}
		if (!options) {
			options = {};
		}
		var scope = null;
		if (options.hasOwnProperty('scope')) {
			scope = options.scope;
		}
		var release = (function () {
			var released = false;
			return function () {
				if (!released) {
					released = true;
					lock.readers--;
					if (lock.queue.length) {
						lock.queue[0]();
					}
				}
			};
		}());
		if ((lock.readers < 0) || lock.queue.length) {
			var terminated = false;
			lock.queue.push(function () {
				if (!terminated && (lock.readers >= 0)) {
					terminated = true;
					lock.queue.shift();
					lock.readers++;
					callback.call(scope, release);
					if (lock.queue.length) {
						lock.queue[0]();
					}
				}
			});
			if (options.hasOwnProperty('timeout')) {
				var timeoutCallback = null;
				if (options.hasOwnProperty('timeoutCallback')) {
					timeoutCallback = options.timeoutCallback;
				}
				setTimeout(function () {
					if (!terminated) {
						terminated = true;
						if (timeoutCallback) {
							timeoutCallback.call(options.scope);
						}
					}
				}, options.timeout);
			}
		} else {
			lock.readers++;
			callback.call(options.scope, release);
		}
	}

	/**
	 * Acquires a write lock and invokes a user-defined callback as soon as it
	 * is acquired.
	 *
	 * The operation might require some time as there may be one or more
	 * readers. You can optionally specify a timeout in milliseconds: if it
	 * expires before a read lock can be acquired, this request is canceled and
	 * no lock will be acquired.
	 *
	 * The `key` argument allows you to work on a specific lock; omitting it
	 * will request the default lock.
	 *
	 * @method writeLock
	 * @param [key] {String} The name of the lock to write-acquire. The default
	 * lock will be requested if no key is specified.
	 * @param callback {Function} A user-defined function invoked as soon as a
	 * write lock is acquired.
	 * @param callback.release {Function} A function that releases the lock.
	 *
	 * This must be called by the ReadWriteLock user at some point, otherwise
	 * the write lock will remain and prevent future readers from operating.
	 * Anyway you do not necessarily need to call it inside the `callback`
	 * function: you can save a reference to the `release` function and call it
	 * later.
	 * @param [options] {Object} Further optional settings.
	 * @param [options.scope] {Object} An optional object to use as `this` when
	 * calling the `callback` function.
	 * @param [options.timeout] {Number} A timeout in milliseconds within which
	 * the lock must be acquired; if one ore more readers are still operating
	 * and the timeout expires the request is canceled and no lock is acquired.
	 * @param [options.timeoutCallback] {Function} An optional user-defined
	 * callback function that gets invokes in case the timeout expires before
	 * the lock can be acquired.
	 */
	function writeLock(key, callback, options) {
		var lock;
		if (typeof key !== 'function') {
			if (!table.hasOwnProperty(key)) {
				table[key] = new Lock();
			}
			lock = table[key];
		} else {
			options = callback;
			callback = key;
			lock = defaultLock;
		}
		if (!options) {
			options = {};
		}
		var scope = null;
		if (options.hasOwnProperty('scope')) {
			scope = options.scope;
		}
		var release = (function () {
			var released = false;
			return function () {
				if (!released) {
					released = true;
					lock.readers = 0;
					if (lock.queue.length) {
						lock.queue[0]();
					}
				}
			};
		}());
		if (lock.readers || lock.queue.length) {
			var terminated = false;
			lock.queue.push(function () {
				if (!terminated && !lock.readers) {
					terminated = true;
					lock.queue.shift();
					lock.readers = -1;
					callback.call(options.scope, release);
				}
			});
			if (options.hasOwnProperty('timeout')) {
				var timeoutCallback = null;
				if (options.hasOwnProperty('timeoutCallback')) {
					timeoutCallback = options.timeoutCallback;
				}
				setTimeout(function () {
					if (!terminated) {
						terminated = true;
						if (timeoutCallback) {
							timeoutCallback.call(scope);
						}
					}
				}, options.timeout);
			}
		} else {
			lock.readers = -1;
			callback.call(options.scope, release);
		}
	}

	this.readLock = readLock;
	this.writeLock = writeLock;

	this.async = {
		/**
		 * TODO
		 *
		 * @method async.readLock
		 * @param [key] {String} The name of the lock to read-acquire. The
		 * default lock will be requested if no key is specified.
		 * @param callback {Function} A user-defined function invoked as soon as
		 * a read lock is acquired.
		 * @param callback.release {Function} A function that releases the lock.
		 *
		 * This must be called by the ReadWriteLock user at some point,
		 * otherwise the read lock will remain and prevent any writers from
		 * operating. Anyway you do not necessarily need to call it inside the
		 * `callback` function: you can save a reference to the `release`
		 * function and call it later.
		 * @param [options] {Object} Further optional settings.
		 * @param [options.scope] {Object} An optional object to use as `this`
		 * when calling the `callback` function.
		 * @param [options.timeout] {Number} A timeout in milliseconds within
		 * which the lock must be acquired; if a writer is still operating and
		 * the timeout expires the request is canceled and no lock is acquired.
		 * @param [options.timeoutCallback] {Function} An optional user-defined
		 * callback function that gets invokes in case the timeout expires
		 * before the lock can be acquired.
		 */
		readLock: function (key, callback, options) {
			if (typeof key !== 'function') {
				readLock(key, function (release) {
					callback.call(this, null, release);
				}, options);
			} else {
				callback = key;
				options = callback;
				readLock(function (release) {
					callback.call(this, null, release);
				}, options);
			}
		},

		/**
		 * TODO
		 *
		 * @method async.writeLock
		 * @param [key] {String} The name of the lock to write-acquire. The
		 * default lock will be requested if no key is specified.
		 * @param callback {Function} A user-defined function invoked as soon as
		 * a write lock is acquired.
		 * @param callback.release {Function} A function that releases the lock.
		 *
		 * This must be called by the ReadWriteLock user at some point,
		 * otherwise the write lock will remain and prevent future readers from
		 * operating. Anyway you do not necessarily need to call it inside the
		 * `callback` function: you can save a reference to the `release`
		 * function and call it later.
		 * @param [options] {Object} Further optional settings.
		 * @param [options.scope] {Object} An optional object to use as `this`
		 * when calling the `callback` function.
		 * @param [options.timeout] {Number} A timeout in milliseconds within
		 * which the lock must be acquired; if one ore more readers are still
		 * operating and the timeout expires the request is canceled and no lock
		 * is acquired.
		 * @param [options.timeoutCallback] {Function} An optional user-defined
		 * callback function that gets invokes in case the timeout expires
		 * before the lock can be acquired.
		 */
		writeLock: function (key, callback, options) {
			if (typeof key !== 'function') {
				writeLock(key, function (release) {
					callback.call(this, null, release);
				}, options);
			} else {
				callback = key;
				options = callback;
				writeLock(function (release) {
					callback.call(this, null, release);
				}, options);
			}
		}
	};
};
