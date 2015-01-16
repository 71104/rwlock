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
			release();
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
			release();
			test.done();
		});
		setTimeout(function () {
			released = true;
			release();
		}, 0);
	});
};

module.exports.lateWriterReleaseAgainstAnotherWriter = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		var released = false;
		lock.writeLock(function (release) {
			test.ok(released);
			release();
			test.done();
		});
		setTimeout(function () {
			released = true;
			release();
		}, 0);
	});
};

module.exports.noReaderTimeout = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release) {
		lock.readLock(function (release) {
			test.ok(true);
			release();
			test.done();
		}, {
			timeout: 0,
			timeoutCallback: function () {
				test.ok(false);
				test.done();
			}
		});
		setTimeout(release, 10);
	});
};

module.exports.writerTimeout = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release) {
		lock.writeLock(function (release) {
			test.ok(false);
			test.done();
		}, {
			timeout: 0,
			timeoutCallback: function () {
				test.ok(true);
				test.done();
			}
		});
		setTimeout(release, 10);
	});
};

module.exports.readerTimeout = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		lock.readLock(function (release) {
			test.ok(false);
			test.done();
		}, {
			timeout: 0,
			timeoutCallback: function () {
				test.ok(true);
				test.done();
			}
		});
		setTimeout(release, 10);
	});
};

module.exports.readerTimeout = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		lock.readLock(function (release) {
			test.ok(false);
			test.done();
		}, {
			timeout: 0
		});
		lock.readLock(function (release) {
			test.ok(true);
			test.done();
		}, {
			timeout: 20,
			timeoutCallback: function () {
				test.ok(false);
				test.done();
			}
		});
		setTimeout(release, 10);
	});
};

module.exports.writerTimeoutAgainstAnotherWriter = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		lock.writeLock(function (release) {
			test.ok(false);
			test.done();
		}, {
			timeout: 0,
			timeoutCallback: function () {
				test.ok(true);
				test.done();
			}
		});
		setTimeout(release, 10);
	});
};

module.exports.writerTimeoutAgainstAnotherWriterNewWriter = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		lock.writeLock(function (release) {
			test.ok(false);
			test.done();
		}, {
			timeout: 0
		});
		lock.writeLock(function (release) {
			test.ok(true);
			test.done();
		}, {
			timeout: 20,
			timeoutCallback: function() {
				test.ok(false);
				test.done();
			}
		});
		setTimeout(release, 10);
	});
};

module.exports.avoidWriterTimeout = function (test) {
	var lock = new ReadWriteLock();
	lock.readLock(function (release) {
		lock.writeLock(function (release) {
			test.ok(true);
			release();
			test.done();
		}, {
			timeout: 10,
			timeoutCallback: function () {
				test.ok(false);
				test.done();
			}
		});
		setTimeout(release, 0);
	});
};

module.exports.avoidReaderTimeout = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		lock.readLock(function (release) {
			test.ok(true);
			release();
			test.done();
		}, {
			timeout: 10,
			timeoutCallback: function () {
				test.ok(false);
				test.done();
			}
		});
		setTimeout(release, 0);
	});
};

module.exports.avoidWriterTimeoutAgainstAnotherWriter = function (test) {
	var lock = new ReadWriteLock();
	lock.writeLock(function (release) {
		lock.writeLock(function (release) {
			test.ok(true);
			release();
			test.done();
		}, {
			timeout: 10,
			timeoutCallback: function () {
				test.ok(false);
				test.done();
			}
		});
		setTimeout(release, 0);
	});
};
