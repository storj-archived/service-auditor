'use strict';

const Async = require('async');
const Storj = require('storj-lib');
const Log = require('../../logger.js');
const AuditQueue = require('./queue.js');
const Complex = require('storj-complex');
const StorageModels = require('storj-service-storage-models');
const MongoAdapter = require('storj-mongodb-adapter');
const Manager = Storj.StorageManager;

/**
 * RedisAuditor Service
 * @constructor
 * @param {Object} queue - storage queue for scheduled audits
 * @param {Object} network - renter interface
 */

function RedisAuditor(options) {
  this._options = options;
  this._queue = new AuditQueue(this._options.auditor.uuid, this._options.auditor.adapter);
  this._storjClient = Complex.createClient(this._options.storjClient);
  this._storjModels = new StorageModels(options.db);
  this._mongoAdapter = new MongoAdapter(this._storjModels);
  this._manager = new Storj.StorageManager(this._mongoAdapter);
};

/**
 * Alias for audit queue instance's popReadyQueue method
 * @param {Function} callback
 */

RedisAuditor.prototype.get = function(callback) {
  return this._queue.popReadyQueue(callback);
};

/**
 * Alias for audit queue instance's awaitReadyQueue method
 * @param {Function} callback
 */

RedisAuditor.prototype.awaitGet = function(callback) {
  return this._queue.awaitReadyQueue(callback);
};

RedisAuditor.prototype.verify = function(audit, callback) {
  var contact;

  this._storjModels.Contact.findOne(
    {_id: audit.id},
    handleContactLookup.bind(this)
  );

  function handleContactLookup(err, farmer) {
    if(err) return callback(err);
    contact = new Storj.Contact(farmer);
    this._manager.load(audit.hash, handleStorageItemLookup.bind(this));
  }

  function handleStorageItemLookup(err, storageItem) {
    if(err) return callback(err);

    this._storjClient.getStorageProof(
      contact,
      storageItem,
      function getProofResult(err, proof) {
        if(err) return callback(err);
        var verification = new Storj.Verification(proof);
        var result = verification.verify(audit.root, audit.depth)
        var hasPassed = result[0] === result[1];
        return callback(null, audit, hasPassed);
      }
    );
  }
};

RedisAuditor.prototype.commit = function(audit, hasPassed, callback) {
  this._queue.pushResultQueue(audit, hasPassed, function(err, isSuccess) {
    if(err) return callback(err);
    return callback(null, isSuccess);
  });
};

RedisAuditor.prototype.process = function(audit, nextAudit) {
  Async.waterfall([
   Async.apply(this.verify.bind(this), audit),
   this.commit.bind(this)
  ], function done(err) {
   if(err) Log.error(err.message);
   return nextAudit();
  });
};

RedisAuditor.prototype.getPendingQueue = function(callback) {
  return this._queue.getPendingQueue(callback);
};

module.exports = RedisAuditor;
