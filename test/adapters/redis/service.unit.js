'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
var AuditQueue = function() {};

AuditQueue.prototype.populateReadyQueue = function() {
  return {
    testProp: true
  };
}
var AuditWorker = function() {
  return {
    testProp: true
  };
};

var Config = require('../../../config');

var popSpy = sinon.spy(AuditQueue.prototype, 'populateReadyQueue');

var AuditService = proxyquire('../../../lib/adapters/redis/service.js',
 {
  './queue': AuditQueue,
  './queueworker': AuditWorker
});
Config.auditor.polling.interval = 100;
const service = new AuditService(Config);

describe('audit/adapters/redis/service', function() {
  describe('#createWorker', function() {
    var audit_worker;

    before(function() {
      audit_worker = service.createWorker();
    });

    it('should return an audit service worker',
      function() {
        expect(audit_worker.testProp).to.be.true;
    });
  });

  describe('#createPoll', function() {
    var poll_worker;

    before(function() {
      poll_worker = service.createPoll();
    });

    it('should return an interval',
      function() {
        expect(poll_worker._onTimeout).to.exist;
    });

    it('should create an instance of the queue class',
      function() {
        expect(service.masterPollQueue).to.exist;
    });

    it('should call populateReadyQueue at the specified interval',
      function(done) {
        this.timeout(20000);
        setTimeout(() => {
          expect(popSpy.called).to.be.true;
          done();
        }, Config.auditor.polling.interval+100);
    });
  });
});
