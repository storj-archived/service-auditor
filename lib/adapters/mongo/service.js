'use strict';

const RabbitMQ = require('rabbit.js');
const Mongoose = require('mongoose');
const Log = require('../../logger');
const QueueWorker = require('./queueworker');
const AuditModel = require('./auditmodel');

function AuditService(options) {
  this._options = options;
}

AuditService.prototype.createWorker = function() {
  Log.info('starting worker uuid: ' + this._options.auditor.uuid);
  const service = new QueueWorker(this._options);
  return service;
};

AuditService.prototype.createPoll = function() {
  this._mongoConnection = Mongoose.createConnection(
    this._options.mongo.uri,
    this._options.mongo.options
  );

  this._amqpContext = RabbitMQ.createContext(
    this._opts.amqpUrl,
    this._opts.amqpOpts
  );

  this.pusher = this._amqpContext.socket('PUSH');

  this.auditModel = new AuditModel(this._mongoConnection);

  var interval = setInterval(
    () => {
      this._options.auditor.polling.padding = this._options.auditor.polling.padding || 0;
      var currTime = Date.now() + this._options.auditor.polling.padding;
      this.auditModel.popReadyAudits(currTime, (err, result) => {

      })

    },
    this._options.auditor.polling.interval
  );

  return interval;
};
