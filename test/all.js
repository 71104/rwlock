var ReadWriteLock = require('../lib/lock.js');

module.exports.readerOperates = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release) {
		release();
		test.ok(true);
		test.done();
	});
};

module.exports.writerOperates = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		release();
		test.ok(true);
		test.done();
	});
};

module.exports.twoReaders = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release1) {
		var released = false;
		lock.readLock(function (release2) {
			test.ok(!released);
			release2();
			test.done();
		});
		released = true;
		release1();
	});
};

module.exports.twoWriters = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release1) {
		var released = false;
		lock.writeLock(function (release2) {
			test.ok(released);
			release2();
			test.done();
		});
		released = true;
		release1();
	});
};

module.exports.oneReaderOneWriter = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release1) {
		var released = false;
		lock.writeLock(function (release2) {
			test.ok(released);
			release2();
			test.done();
		});
		released = true;
		release1();
	});
};

module.exports.oneWriterOneReader = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release1) {
		var released = false;
		lock.readLock(function (release2) {
			test.ok(released);
			release2();
			test.done();
		});
		released = true;
		release1();
	});
};

module.exports.twoReadersOneWriter = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release1) {
		var released = 0;
		lock.readLock(function (release2) {
			lock.writeLock(function (release3) {
				test.equal(released, 2);
				release3();
				test.done();
			});
			released++;
			release2();
		});
		released++;
		release1();
	});
};
