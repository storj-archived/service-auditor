#!/usr/bin/env node

'use strict';

const fork = require('child_process').fork;
const clone = require('merge').clone;
const log = require('../../../../lib/logger');
const WORKERPATH = './lib/audit/adapters/redis/worker.js';
const AuditQueue = require('./queue.js');

function AuditService(options) {
  this._options = options;
  this._workers = {};

  log.info('master audit service forking '
    + this._options.workers.length + ' workers...'
  );

  if(this._options.auditor.polling) {
    this._masterPollQueue = new AuditQueue(this._options.auditor.adapter, 'master');
    this.pollBacklog(this._options.auditor.polling.padding);

    this._interval = setInterval(
      this.pollBacklog.bind(this, this._options.auditor.polling.padding),
      this._options.auditor.polling.interval
    );
  }

  this._options.auditor.workers.forEach(function(workerUuid) {
    this.addNewWorkerToQueue(workerUuid);
  }.bind(this));
};

AuditService.prototype.addNewWorkerToQueue = function(workerUuid) {
  var opts = JSON.parse(JSON.stringify(this._options));
  delete opts.adapter.auditor.workers;
  opts.adapter.auditor.uuid = workerUuid;

  log.info('starting worker uuid: ' + workerUuid);
  this._workers[opts.adapter.auditor.uuid] = fork(WORKERPATH, [JSON.stringify(opts)]);

  this._workers[opts.adapter.auditor.uuid].on('exit', function(code, signal) {
    delete this._workers[opts.adapter.auditor.uuid];
    log.info('worker uuid:' + opts.adapter.auditor.uuid
      + ' exited with code: ' + code
      + ', signal: ' + signal
    );
    this.addNewWorkerToQueue(opts);
  }.bind(this));

  this._workers[opts.adapter.auditor.uuid].on('error', function(err) {
    log.error(err);
  });
};

AuditService.prototype.pollBacklog = function(timePadding) {
  var timePadding = timePadding || 0;
  var currTime = Date.now() + timePadding;

  this._masterPollQueue.populateReadyQueue(
    0,
    currTime,
    function(err, hasAudits) {
      if(err) log.error(err);
  });
}

module.exports = AuditService;
