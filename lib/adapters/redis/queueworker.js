'use strict';
/* jshint ignore:start */
const Async = require('async');
/* jshint unused: vars */
const Log = require('../../logger');
const Auditor = require('./auditor');

/**
 * Audit Dispatch Service
 * @constructor
 * @param {Object} options - Dispatch service options
 * @param {Object} options.limit - max simultaneous outgoing requests per worker
 */

function AuditQueueWorker(options) {
  this._options = options;
  this._auditor = new Auditor(options);
  this._flushStalePendingQueue(this._initDispatchQueue.bind(this));
}

AuditQueueWorker.prototype._flushStalePendingQueue = function(callback) {
  var pendingQueue = Async.queue(
    this._auditor.process.bind(this._auditor),
    this._options.auditor.maxConcurrency
  );

  this._auditor.getPendingQueue(function(err, pendingAudits) {
    pendingQueue.push(pendingAudits);
    pendingQueue.drain = function() {
      return callback();
    };
  });
};

AuditQueueWorker.prototype._initDispatchQueue = function() {
  var isWaiting = false;
  var outstandingGets;
  var retrievedAudits = 0;

  var getQueue = Async.queue(
    getAudits.bind(this),
    this._options.auditor.maxConcurrency
  );

  var dispatchQueue = Async.queue(
    this._auditor.process.bind(this._auditor),
    this._options.auditor.maxConcurrency
  );

  while(retrievedAudits < this._options.auditor.maxConcurrency) {
    retrievedAudits++;
    getQueue.push(this._auditor.get.bind(this._auditor));
  }

  function getAudits(getMethod, done) {
    getMethod(function(err, audit) {
      if(err) {
        Log.error(err);
        getQueue.unshift(getMethod.bind(this._auditor));
        return done(null);
      } else if(audit === null) {
        if(!isWaiting) {
          isWaiting = true;
          getQueue.push(this._auditor.awaitGet.bind(this._auditor), function(err) {
            /* jshint unused: vars */
            isWaiting = false;
            outstandingGets = getQueue.length() + getQueue.running();
            while(outstandingGets < this._options.auditor.maxConcurrency) {
              getQueue.push(this._auditor.get.bind(this._auditor));
              outstandingGets = getQueue.length() + getQueue.running();
            }
          }.bind(this));
        }
        return done(null);
      } else {
        getQueue.push(this._auditor.get.bind(this._auditor));
        dispatchQueue.push(audit, function(err) {
          /* jshint unused: vars */
          return done(null);
        }.bind(this));
      }
    }.bind(this));
  }

};

module.exports = AuditQueueWorker;
/* jshint ignore:end */
