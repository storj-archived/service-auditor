'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const AuditQueue = require('../../../lib/adapters/redis/queue.js');
const Config = require('../../../config');

var popSpy = sinon.spy(AuditQueue.prototype, 'populateReadyQueue');
var forkStub = function() {
  return {
    on: sinon.stub()
  };
};

var AuditService = proxyquire('../../../lib/adapters/redis/service.js',
 {
  '../../../lib/adapters/redis/queue.js': AuditQueue,
  'child_process': {
    fork: forkStub
  }
});

var service;
var config;

describe('audit/adapters/redis/service', function() {
  beforeEach(function() {
    sinon.spy(AuditService.prototype, 'pollBacklog');
  });

  afterEach(function() {
    AuditService.prototype.pollBacklog.restore();
  });

  describe('@constructor', function() {
    before(function() {
      sinon.spy(AuditService.prototype, 'addNewWorkerToQueue');
    });

    it('should not call #pollBacklog if polling option disabled', function() {
      config = JSON.parse(JSON.stringify(Config));
      config.auditor.polling = undefined;
      service = new AuditService(config);
      expect(service.pollBacklog.called).to.be.false;
    });

    it('should call #pollBacklog if polling option enabled', function() {
      config = JSON.parse(JSON.stringify(Config));
      config.auditor.polling = {
        interval: 500,
        padding: 0
      };

      service = new AuditService(config);
      expect(service.pollBacklog.called).to.be.true;
    });

    it('should call #addNewWorkerToQueue for each worker option',
      function() {
        AuditService.prototype.addNewWorkerToQueue.restore();
        sinon.spy(AuditService.prototype, 'addNewWorkerToQueue');
        config = JSON.parse(JSON.stringify(Config));
        service = new AuditService(config);
        var workers = service._options.auditor.workers.split(' ');

        expect(workers.length).to.equal(service.addNewWorkerToQueue.callCount);
        AuditService.prototype.addNewWorkerToQueue.restore();
    });

    it('should repoll at a configured interval', function(done) {
      this.timeout(1000);
      config = JSON.parse(JSON.stringify(Config));
      config.auditor.polling.interval = 500;
      service = new AuditService(config);
      setTimeout(testPolled, config.auditor.polling.interval + 100);

      function testPolled() {
        expect(service.pollBacklog.calledTwice).to.be.true;
        done();
      }
    });
  });

  describe('#addNewWorkerToQueue', function() {
    before(function() {
      config = JSON.parse(JSON.stringify(Config));
      service = new AuditService(config);
    });

    it('should fork a process for each optional worker', function() {
      var workers = service._options.auditor.workers.split(' ');
      expect(workers.length === forkStub.callCount);
    });
  });

  describe('#pollBacklog', function() {
    it('should accept a current time padding',
      function() {
        config = JSON.parse(JSON.stringify(Config));
        config.auditor.polling.interval = 500;
        config.auditor.polling.padding = 100;
        service = new AuditService(config);
        expect(service.pollBacklog.getCall(0).args[0]
          === config.auditor.polling.padding).to.be.true;
    });

    it('should call populateReadyQueue',
      function() {
        expect(service._masterPollQueue.populateReadyQueue.called).to.be.true;
    });
  });
});
