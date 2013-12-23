rwlock
======

Asynchronous read/write lock implementation for Node.js.

Main rules:
- there may be zero or more readers at a time,
- there may only be one writer at a time,
- there may be no writer if there are one or more readers already.

Basic usage
-----------

Requiring the package, creating an instance:

```javascript
var ReadWriteLock = require('rwlock');

var lock = new ReadWriteLock();
```

Acquiring a read lock:

```javascript
lock.readLock(function (release) {
	// do stuff

	release();
});
```

Acquiring a write lock:

```javascript
lock.writeLock(function (release) {
	// do stuff

	release();
});
```

Locks can be released later:

```javascript
lock.readLock(function (release) {
	// not ready to release yet

	setTimeout(function () {
		// ok, now I'm ready
		release();
	}, 1000);
});
```

Sections
--------

"Sections" are functions executed within a read or write lock and need not be
released.

Example:

```javascript
lock.readSection(function () {
	console.log('No one is writing now');
});

lock.writeSection(function () {
	console.log('No one is reading now');
});
```

Keys
----

Every ReadWriteLock instance allows you to work on a virtually unlimited number of completely independent read/write locks.

Locks are identified by names called "keys". Every exposed method has an optional "key" first argument indicating the lock to work on; if you don't specify a key, the default lock is used.

Example:

```javascript
lock.writeLock('lock1', function (release) {
	console.log('writing 1...');
	lock.writeLock('lock2', function (release) {
		console.log('writing 2...');
		release();
		console.log('done 2.');
	});
	release();
	console.log('done 1.');
});
```

The previous example logs:

```
writing 1...
writing 2...
done 1.
done 2.
```

[async](https://npmjs.org/package/async) compatibility
------------------------------------------------------

The ReadWriteLock class does not return errors to your callbacks, but many APIs in Node do. The `async` module uses that as a convention: callbacks usually receive two arguments, a possibly `null` error object and the actual result in case there is no error.

To aid `async` compatibility, ReadWriteLock sends `null` errors if you specify the `async` flag like in the following example:

```javascript
lock.async.readLock(function (error, release) {
	// no need to check on error, it will always be null

	// do stuff here

	release();
});
```

You can use `rwlock` and `async` together like in this example:

TODO
