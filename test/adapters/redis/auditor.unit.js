'use strict'

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const RQueue = require('../../../lib/adapters/redis/queue.js');
const Models = require('storj-service-storage-models');
const Config = require('../../../config');

var stubRefs = {
  queue: sinon.spy(RQueue),
  models: sinon.spy(Models),
  verifyStub: sinon.stub(),
  findContact: sinon.stub(),
  core: sinon.stub(),
  getProof: sinon.stub(),
  popReadyQueue: sinon.stub(RQueue.prototype, 'popReadyQueue'),
  pushResultQueue: sinon.stub(RQueue.prototype, 'pushResultQueue'),
  awaitReadyQueue: sinon.stub(RQueue.prototype, 'awaitReadyQueue'),
  getPendingQueue: sinon.stub(RQueue.prototype, 'getPendingQueue')
};

var Auditor = proxyquire(
  '../../../lib/adapters/redis/auditor.js', {
    'storj-lib': {
      Verification: function() {
        return {
          verify: function() {
            return [0,0];
          }
        };
      },
      Contact: function(farmer) {
        this.farmer = farmer;
      }
    },
    './queue.js': stubRefs.queue,
    'storj-service-storage-models': stubRefs.models,
    'storj-complex': {
      createClient: function() {
        return {
          getStorageProof: stubRefs.getProof
        };
      }
    }
});

var service;
var config = JSON.parse(JSON.stringify(Config));


config.auditor.uuid = config.auditor.workers[0];
delete config.auditor.workers[0];
service = new Auditor(config);

describe('audit/adapters/redis/auditor', function() {
  describe('@constructor', function() {
    it('accepts an options object', function() {
      expect(service._options).to.be.an('object');
    });

    it('instantiates a mongo adapter', function() {
      expect(service._mongoAdapter).to.be.an('object');
    });

    it('instantiates a storj manager', function() {
      expect(service._manager).to.be.an('object');
    });

    it('instantiates a queue', function() {
      expect(service._queue).to.be.an('object');
      expect(stubRefs.queue.calledWithNew()).to.be.true;
    });

    it('instantiates storj models', function() {
      expect(service._storjModels).to.be.an('object');
    });

    it('instantiates a storj client', function() {
      expect(service._storjClient).to.be.an('object');
    });
  });

  describe('get', function() {
    var auditResp;

    before(function() {
      service._queue.popReadyQueue.callsArgWith(0, null, {audit: true});
      service.get(function(err, audit) {
        auditResp = audit;
      });
    });

    it('calls the queue\'s popReadyQueue method', function() {
      expect(service._queue.popReadyQueue.called).to.be.true;
    });

    it('returns an audit', function() {
      expect(auditResp.audit).to.be.true;
    });
  });

  describe('awaitGet', function() {
    var auditResp;

    before(function() {
      service._queue.awaitReadyQueue.callsArgWith(0, null, {audit: true});
      service.awaitGet(function(err, audit) {
        auditResp = audit;
      });
    });

    it('calls the queue\'s awaitReadyQueue method', function() {
      expect(service._queue.awaitReadyQueue.called).to.be.true;
    });

    it('returns an audit', function() {
      expect(auditResp.audit).to.be.true;
    });
  });

  describe('verify', function() {
    this.timeout(5000);
    var test_audit;
    var status;
    var verifyInput = {
      id: 123,
      hash: '9265686745289308931442272754955968fk59f9',
      challenge: 9
    };

    service._storjModels = {
      Contact: {
        findOne: sinon.stub()
      }
    };

    service._manager = {
      load: sinon.stub()
    };

    service._storjClient = {
      getStorageProof: sinon.stub()
    };

    service._storjModels.Contact.findOne.callsArgWith(1, null, 'storage');
    service._manager.load.callsArgWith(1, null, verifyInput);
    service._storjClient.getStorageProof.callsArgWith(2, null, '123');

    service.verify(verifyInput, function(err, audit, hasPassed) {
      test_audit = audit;
      status = hasPassed;
    });

    it('attempts to locate an in-storage contact', function() {
      expect(service._storjModels.Contact.findOne.called).to.be.true
    });

    it('gets a storageItem from the audit hash', function() {
      expect(service._manager.load.called).to.be.true;
    });

    it('calls the network\'s getStorageProof method', function() {
      expect(service._storjClient.getStorageProof.called).to.be.true;
    });

    it('returns the audit and its verification status', function() {
      expect(test_audit.id).to.equal(123);
      expect(status).to.be.true;
    });
  });

  describe('commit', function() {
    var test_succcess;

    before(function() {
      service._queue.pushResultQueue.callsArgWith(2, null, true);
      service.commit(1, 1, function(err, isSuccess) {
        test_succcess = isSuccess;
      });
    });

    it('calls the queue\'s pushResultQueue method', function() {
      expect(service._queue.pushResultQueue.called).to.be.true;
    });

    it('returns the push status', function() {
      expect(test_succcess).to.be.true;
    });
  });
});
