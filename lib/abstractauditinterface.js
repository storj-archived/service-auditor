'use strict';

const Assert = require('assert');
const Inherits = require('util').inherits;
const ReadableStream = require('stream').Readable;
const WriteableStream = require('stream').Writeable;

Inherits(AbstractAuditInterface, ReadableStream);

/**
 * Abstract external interface for audits
 * @constructor
 */

function AbstractAuditInterface(adapter) {
  this.adapter = adapter;
  /*
  this.Events = {
    pass: 'audit.full.pass',
    fail: 'audit.full.fail'
  };

  this.setMaxListeners(Infinity);
  */
}

/**
 * abstract class to add audits to the storage adapter
 * @param {Object[]} audits
 * @param {Number} audits[].ts - The Audit's scheduled time
 * @param {Object} audits[].data - Data required to fulfill the audit
 * @param {Object} audits[].data.id - Renter's shard contract primary key
 * @param {Object} audits[].data.root - Merkle root
 * @param {Object} audits[].data.depth - Merkle depth
 * @param {Object} audits[].data.challenge - Audit Challenge
 * @param {Object} audits[].data.hash - Hash of the consigned data
 * @param {AbstractAuditInterface~add} callback
 */

 /**
  * Callback used by add.
  * @callback AbstractAuditInterface~add
  * @param {Error} err - Error
  * @param {Number} count - An integer of audits added.
  */

AbstractAuditInterface.prototype.passReadStream = new ReadableStream();
AbstractAuditInterface.prototype.failReadStream = new ReadableStream();
//AbstractAuditInterface.prototype.errReadStream = new ReadableStream();

AbstractAuditInterface.prototype.add = function(audits, callback) {
  /* jshint unused: vars */
  throw new Error('Method not implemented');
};

/**
 * creates an AuditJob from a StorageItem
 * @param {String} key - a node ID
 * @param {StorageItem} item - an instance of StorageItem
 */

AbstractAuditInterface.prototype.createAuditJobs = function(opts) {
  Assert(opts.farmer);
  Assert(opts.hash);
  Assert(opts.root);
  Assert(opts.depth);
  Assert(opts.challenges);
};

module.exports = AbstractAuditInterface;
