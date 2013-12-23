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
