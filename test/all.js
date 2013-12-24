var ReadWriteLock = require('../lib/lock.js');

module.exports.oneReaderOperates = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release) {
		release();
		test.ok(true);
		test.done();
	});
};

module.exports.twoReadersOperate = function (test) {
	var lock = new ReadWriteLock();
	var count = 0;
	lock.readLock(function (release) {
		test.ok(true);
		release();
		if (++count > 1) {
			test.done();
		}
	});
	lock.readLock(function (release) {
		test.ok(true);
		release();
		if (++count > 1) {
			test.done();
		}
	});
};

module.exports.oneWriterOperates = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		release();
		test.ok(true);
		test.done();
	});
};

module.exports.twoWritersOperate = function (test) {
	var lock = new ReadWriteLock();
	var count = 0;
	lock.writeLock(function (release) {
		test.ok(true);
		release();
		if (++count > 1) {
			test.done();
		}
	});
	lock.writeLock(function (release) {
		test.ok(true);
		release();
		if (++count > 1) {
			test.done();
		}
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

module.exports.lateReaderRelease = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release) {
		var released = false;
		lock.writeLock(function (release) {
			test.ok(released);
			test.done();
		});
		setTimeout(function () {
			released = true;
			release();
		}, 0);
	});
};

module.exports.lateWriterRelease = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		var released = false;
		lock.readLock(function (release) {
			test.ok(released);
			test.done();
		});
		setTimeout(function () {
			released = true;
			release();
		}, 0);
	});
};
