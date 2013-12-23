/**
 * Asynchronous read/write lock implementation for Node.
 *
 * The rules:
 *	- there may be zero or more readers at the same time,
 *	- there may be only one writer at a time,
 *	- if there is a writer there may be no readers.
 *
 * ReadWriteLock also supports multiple independent locks identified by custom
 * user-defined strings called `keys'.
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
			lock.queue.push(function () {
				if (lock.readers >= 0) {
					lock.queue.shift();
					lock.readers++;
					if (options.hasOwnProperty('scope')) {
						callback.call(options.scope, release);
					} else {
						callback(release);
					}
					if (lock.queue.length) {
						lock.queue[0]();
					}
				}
			});
		} else {
			lock.readers++;
			if (options.hasOwnProperty('scope')) {
				callback.call(options.scope, release);
			} else {
				callback(release);
			}
		}
	}

	/**
	 * TODO
	 *
	 * @method writeLock
	 * @param [key] {String} TODO
	 * @param callback {Function} TODO
	 * @param callback.release {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
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
			lock.queue.push(function () {
				if (!lock.readers) {
					lock.queue.shift();
					lock.readers = -1;
					if (options.hasOwnProperty('scope')) {
						callback.call(options.scope, release);
					} else {
						callback(release);
					}
				}
			});
		} else {
			lock.readers = -1;
			if (options.hasOwnProperty('scope')) {
				callback.call(options.scope, release);
			} else {
				callback(release);
			}
		}
	}

	/**
	 * TODO
	 *
	 * @method readSection
	 * @param [key] {String} TODO
	 * @param callback {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
	 */
	function readSection(key, callback, options) {
		if (typeof key !== 'function') {
			if (!options) {
				options = {};
			}
			readLock(key, function (release) {
				callback.call(this);
				release();
			}, options);
		} else {
			readLock(function (release) {
				callback.call(this);
				release();
			}, options);
		}
	}

	/**
	 * TODO
	 *
	 * @method writeSection
	 * @param [key] {String} TODO
	 * @param callback {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
	 */
	function writeSection(key, callback, options) {
		if (typeof key !== 'function') {
			if (!options) {
				options = {};
			}
			writeLock(key, function (release) {
				callback.call(this);
				release();
			}, options);
		} else {
			writeLock(function (release) {
				callback.call(this);
				release();
			}, options);
		}
	}

	this.readLock = readLock;
	this.writeLock = writeLock;
	this.readSection = readSection;
	this.writeSection = writeSection;

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
		},

		readSection: function (key, callback, options) {
			if (typeof key !== 'function') {
				readSection(key, function (release) {
					callback.call(this, null, release);
				}, options);
			} else {
				callback = key;
				options = callback;
				readSection(function (release) {
					callback.call(this, null, release);
				}, options);
			}
		},

		writeSection: function (key, callback, options) {
			if (typeof key !== 'function') {
				writeSection(key, function (release) {
					callback.call(this, null, release);
				}, options);
			} else {
				callback = key;
				options = callback;
				writeSection(function (release) {
					callback.call(this, null, release);
				}, options);
			}
		}
	};
};
