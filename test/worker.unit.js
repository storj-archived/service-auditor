'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

var sandbox;
var worker;
var proxyObj;

beforeEach(function () {
  sandbox = sinon.sandbox.create();
  proxyObj = {
    'async': {
      queue: sandbox.stub().returns({
        push: sandbox.stub()
      })
    },

    'mongoose': {
      createConnection: sandbox.stub()
    },

    'storj-lib': {
        StorageManager: sandbox.stub().returns({
          load: sandbox.stub()
        }),
        Verification: sandbox.stub().returns({
          verify: sandbox.stub()
        }),
        Contact: sandbox.stub()
    },

    'storj-mongodb-adapter': sandbox.stub(),

    'storj-complex': {
      createClient: sandbox.stub().returns({
        getStorageProof: sandbox.stub()
      })
    },

    './logger': {
      error: sandbox.stub()
    },

    'storj-service-storage-models': sandbox.stub().returns({
      models: {
        Contact: {
          findOne: sandbox.stub()
        },
        FullAudit: {
          popReadyAudits: sandbox.stub().returns({
            next: sandbox.stub()
          }),
          handleAuditResult: sandbox.stub()
        }
      }
    })
  };

  const Worker = proxyquire('../lib/worker', proxyObj);
  worker = new Worker({
    storjClient: {},
    mongo: {
      uri: 'test',
      options: 'test'
    },
    maxConcurrency: 3,
    sleepTime: 500
  });
});

afterEach(function () {
  sandbox.restore();
});

describe('Worker', function() {
  describe('@constructor', function() {
    it('should create a complex client', () => {
      expect(proxyObj['storj-complex'].createClient.called).to.be.true;
    });

    it('should create an instance reference to the audit model', () => {
      expect(worker._auditModel).to.exist;
    });

    it('should create an instance reference to the contact model', () => {
      expect(worker._contactModel).to.exist;
    });

    it('should create an interal queue', () => {
      expect(proxyObj['async'].queue.called).to.be.true;
      expect(worker.queue).to.exist;
    });

  });

  describe('start', function() {
    it('should call the audit model\'s popReadyAudits method', () => {
      worker.start();
      expect(worker._auditModel.popReadyAudits.called).to.be.true;
    });

    it('should register and call the queue\'s unsaturated method', () => {
      var nextStub = sandbox.stub();
      worker._auditModel.popReadyAudits.callsArgWith(0, {next: nextStub});
      worker.start();
      expect(nextStub.called).to.be.true;
    });
  });

  describe('_addToQueue', function() {
    beforeEach(function() {
      sinon.stub(worker, '_sleep');
    });

    it('should log an error if an error is returned', () => {
      worker._addToQueue(true, null);
      expect(proxyObj['./logger'].error).to.be.called;
    });

    it('should, when empty, assign a noop to the unsaturated queue callback', () => {
      worker._addToQueue(false, null);
      expect(worker.queue.unsaturated()).to.be.an('undefined');;
    });

    it('should, when empty, call the sleep method', () => {
      worker._addToQueue(false, null);
      expect(worker._sleep.called).to.be.true;
    });

    it('should, when containing an audit, push it to the queue', () => {
      worker._addToQueue(false, {});
      expect(worker.queue.push.called).to.be.true;
    });
  });

  describe('_sleep', function() {
    beforeEach(function() {
      worker._sleep();
    });

    it('should return a timeout', () => {
      var Timeout = setTimeout(function(){}, 0).constructor;
      expect(worker._sleep()).to.be.an.instanceof(Timeout)
    });

    it('should call start once after timeout has expired', (done) => {
      sinon.stub(worker, 'start');
      setTimeout(() => {
        expect(worker.start.called).to.be.true;
        done();
        worker.start.restore();
      }, 1000);
    });

    it('should call the interval with the options sleeptime', () => {
      expect(worker._sleep()._idleTimeout).to.equal(worker._options.sleepTime);
    });
  });

  describe('verify', function() {
    it('finds a contact', () => {
      worker.verify({
        root: 'test',
        depth: 'test',
        id: 'test',
        hash: 'test'
      });
      expect(worker._contactModel.findOne.called).to.be.true;
    });

    it('load a storage item from the manager', () => {
      worker._contactModel.findOne.callsArgWith(1, null, {});
      worker.verify({
        root: 'test',
        depth: 'test',
        id: 'test',
        hash: 'test'
      });

      expect(worker._manager.load.called).to.be.true;

    });

    it('should call complex\'s getStorageProof method', () => {
      worker._contactModel.findOne.callsArgWith(1, null, {});
      worker._manager.load.callsArgWith(1, null, {});
      worker.verify({
        root: 'test',
        depth: 'test',
        id: 'test',
        hash: 'test'
      });

      expect(worker._storjClient.getStorageProof.called).to.be.true;

    });

    it('should call storjlib\'s verfy method', (done) => {
      proxyObj['storj-lib'].Verification().verify.returns([1,1]);
      worker._contactModel.findOne.callsArgWith(1, null, {});
      worker._manager.load.callsArgWith(1, null, {});
      worker._storjClient.getStorageProof.callsArgWith(2, null, {});
      worker.verify({
        root: 'test',
        depth: 'test',
        id: 'test',
        hash: 'test'
      }, () => {
        expect(proxyObj['storj-lib'].Verification().verify.called).to.be.true;
        expect(proxyObj['storj-lib'].Verification.calledWithNew()).to.be.true;
        done();
      });
    });

    it('should return the result of a passed audit', (done) => {
      proxyObj['storj-lib'].Verification().verify.returns([1,1]);
      worker._contactModel.findOne.callsArgWith(1, null, {});
      worker._manager.load.callsArgWith(1, null, {});
      worker._storjClient.getStorageProof.callsArgWith(2, null, {});
      worker.verify({
        root: 'test',
        depth: 'test',
        id: 'test',
        hash: 'test'
      }, (err, audit, hasPassed) => {
        expect(hasPassed).to.be.true;
        done();
      });
    });

    it('should return the result of a failed audit', (done) => {
      proxyObj['storj-lib'].Verification().verify.returns([1,0]);
      worker._contactModel.findOne.callsArgWith(1, null, {});
      worker._manager.load.callsArgWith(1, null, {});
      worker._storjClient.getStorageProof.callsArgWith(2, null, {});
      worker.verify({
        root: 'test',
        depth: 'test',
        id: 'test',
        hash: 'test'
      }, (err, audit, hasPassed) => {
        expect(hasPassed).to.be.false;
        done();
      });
    });
  });

  describe('commit', function() {
    it('should call the audit model\'s handleAuditResult method with the result', () => {
      worker.commit(1,1,1);
      expect(worker._auditModel.handleAuditResult.called).to.be.true;
    });
  });

  describe('handleIncomingAudit', function() {
    it('should call verify and commit', (done) => {
      sinon.stub(worker, 'verify').callsArgWith(1, null, 1, true);
      sinon.stub(worker, 'commit').callsArgWith(2, null, true);
      worker.handleIncomingAudit(1, (err, isSuccess) => {
        expect(isSuccess).to.be.true;
        done();
      });
    });
  });
});
