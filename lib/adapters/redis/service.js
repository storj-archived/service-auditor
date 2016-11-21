'use strict';

const Log = require('../../logger');
const QueueWorker = require('./queueworker');
const AuditQueue = require('./queue');

function AuditService(options) {
  this._options = options;
}

AuditService.prototype.createWorker = function() {
  Log.info('starting worker uuid: ' + this._options.auditor.uuid);
  const service = new QueueWorker(this._options);
  return service;
};

AuditService.prototype.createPoll = function() {
  this.masterPollQueue = new AuditQueue(
    'master', this._options.auditor.adapter
  );

  var interval = setInterval(
    () => {
      this._options.auditor.polling.padding = this._options.auditor.polling.padding || 0;
      var currTime = Date.now() + this._options.auditor.polling.padding;

      this.masterPollQueue.populateReadyQueue(
        0,
        currTime,
        function(err) {
          if(err) { Log.error(err); }
      });
    },
    this._options.auditor.polling.interval
  );

  return interval;
};

module.exports = AuditService;
