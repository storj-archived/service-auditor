'use strict';

const RabbitMQ = require('rabbit.js');
const mongoose = require('mongoose');
const AuditModel = require('./fullauditmodel');
const ContactModel = require('storj-service-storage-models').models.Contact;
const Log = require('../../logger.js');
const Storj = require('storj-lib');
const MongoAdapter = require('storj-mongodb-adapter');
const Complex = require('storj-complex');

function QueueWorker(options) {
  this._options = options;
  this._storjClient = Complex.createClient(this._options.storjClient);
  this._mongoConnection = Mongoose.createConnection(
    this._options.mongo.uri,
    this._options.mongo.options
  );

  this._auditModel = new AuditModel(this._mongoConnection);
  this._contactModel = new ContactModel(this._mongoConnection);

  this._storjModels = new StorageModels(this._options.mongo.uri, this._options.mongo.options);
  this._mongoAdapter = new MongoAdapter(this._storjModels);
  this._manager = new Storj.StorageManager(this._mongoAdapter);
  this._amqpContext = this._initQueue();

  this._amqpContext.on('close', () => {
    this._amqpContext = this._initQueue()
  });

  this._amqpContext.on('ready', () => {
    this.worker = this._amqpContext.socket('PULL');
    this.worker.connect('storj:audit:full:ready');
    //TODO: see if can be piped directly to complex message queue
    this.worker.on('data', (jsonAudit) => {
      this.handleIncomingAudit(jsonAudit, (err, isSuccess) => {
        if(err) {return Log.error(err.message);}
        Log.info('auditresult:' + jsonAudit._id + ':' + 'isSuccess');
      });
    });
  });
}

QueueWorker.prototype._initQueue = function() {
  var amqpContext = RabbitMQ.createContext(
    this._opts.amqpUrl,
    this._opts.amqpOpts
  );

  amqpContext.on('error', (err) => {
    Log.error(err);
  });

  return amqpContext;
};

QueueWorker.prototype.verify = function(audit, callback) {
  var contact;

  const handleStorageItemLookup = (err, storageItem) => {
    if(err) { return callback(err); }

    this._storjClient.getStorageProof(
      contact,
      storageItem,
      (err, proof) => {
        if(err) { return callback(err); }
        var verification = new Storj.Verification(proof);
        var result = verification.verify(audit.root, audit.depth);
        var hasPassed = result[0] === result[1];
        return callback(null, audit, hasPassed);
      }
    );
  };

  const handleContactLookup = (err, farmer) => {
    if(err) { return callback(err); }
    contact = new Storj.Contact(farmer);
    //TODO: ideally find a way to remove this manager and simply query mongo
    this._manager.load(audit.hash, handleStorageItemLookup);
  };

  this._contactModel.findOne(
    {_id: audit.id},
    handleContactLookup
  );
};


QueueWorker.prototype.commit = function(audit, hasPassed, callback) {
  this._auditModel.handleAuditResult(audit, hasPassed, function(err, isSuccess) {
    if(err) { return callback(err); }
    return callback(null, isSuccess);
  });
};

QueueWorker.prototype.handleIncomingAudit = function(audit, callback) {
  this.verify(audit, (err, audit, hasPassed) => {
    this.commit(audit, hasPassed, (err, isSuccess) => {
      return callback(err, isSuccess);
    });
  });
};

module.exports = QueueWorker;
