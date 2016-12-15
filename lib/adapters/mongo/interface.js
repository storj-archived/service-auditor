'use strict';

const Inherits = require('util').inherits;
const ReadableStream = require('stream').Readable;
const WriteableStream = require('stream').Writeable;
const RabbitMQ = require('rabbit.js');
const Mongoose = require('mongoose');
const Log = require('../../logger.js');
const AbstractAuditInterface = require('../../abstractauditinterface');
const AuditModel = require('./auditmodel');

Inherits(MongoInterface, AbstractAuditInterface);

/**
 * Creates an new external audit interface
 * @constructor
 * @extends {AbstractAuditInterface}
 */

function MongoInterface(adapter) {
  if(this.adapter.type) {
    delete this.adapter.type;
  }

  if(!this.adapter.password) {
    delete this.adapter.password;
  }

  this._amqpContext = this._initQueue();
  this._amqpContext.on('close', () => {
    this._amqpContext = this._initQueue()
  });

  this.passReadStream = this._amqpContext.socket('SUB', {routing: 'direct'});
  this.passReadStream.connect('storj.audit.full.pass');

  this.failReadStream = this._amqpContext.socket('SUB', {routing: 'direct'});
  this.failReadStream.connect('storj.audit.full.fail');

  AbstractAuditInterface.call(this, adapter);
}

/**
 * Adds a series of Audits to the backlog queue
 * @param {Object[]} audits
 * @param {Number} audits[].ts - The Audit's scheduled time
 * @param {Object} audits[].data - Data required to fulfill the audit
 * @param {Object} audits[].data.id - Renter's shard contract primary key
 * @param {Object} audits[].data.root - Merkle root
 * @param {Object} audits[].data.depth - Merkle depth
 * @param {Object} audits[].data.challenge - Audit Challenge
 * @param {Object} audits[].data.hash - Hash of the consigned data
 * @param {AuditQueue~add} callback
 */

MongoInterface.prototype.add = function(audits, callback) {
  this._mongoConnection = this._mongoConnection || Mongoose.createConnection(
    this.adapter.mongo.uri,
    this.adapter.mongo.options
  );

  this._auditModel = this._auditModel || new AuditModel(this._mongoConnection);

  return this._auditModel.insertMany(
    this.createAuditJobs(audits),
    callback
  );
};

MongoInterface.prototype.createAuditJobs = function(opts) {
  AbstractAuditInterface.prototype.createAuditJobs.call(this, opts);
  var auditJobs = [];

  var makeAppointment = (opts, ind) => {
    let auditOutgoingTime;

    if(opts.outgoing) {
      auditOutgoingTime = opts.outgoing;
    } else if(opts.end && opts.start) {
      let duration = opts.end - opts.start
      auditOutgoingTime = opts.start + ( duration * (ind / opts.challenges.length) )
    } else {
      auditOutgoingTime = Date.now();
    }

    return auditOutgoingTime;
  };

  opts.challenges.forEach(function(challenge, ind) {
    var auditJob = {
      farmer_id: opts.farmer,
      data_hash: opts.hash,
      root: opts.root,
      depth: opts.depth,
      challenge: challenge,
      ts: makeAppointment(opts, ind)
    };

    auditJobs.push(auditJob);
  });

  return auditJobs;
};

MongoInterface.prototype._initQueue = function() {
  var amqpContext = RabbitMQ.createContext(
    this.adapter.amqpUrl,
    this.adapter.amqpOpts
  );

  amqpContext.on('error', (err) => {
    Log.error(err);
  });

  return amqpContext;
};

module.exports = MongoInterface;
