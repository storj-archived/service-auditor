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
  var interval;

  this._mongoConnection = Mongoose.createConnection(
    this._options.mongo.uri,
    this._options.mongo.options
  );

  this.auditModel = new AuditModel(this._mongoConnection);

  this._amqpContext = this._initQueue();

  this._amqpContext.on('close', () => {
    this._amqpContext = this._initQueue()
  });

  this._amqpContext.on('ready', () => {
    this.writeableQueueStream = this._amqpContext.socket('PUSH');
    this.writeableQueueStream.connect('storj:audit:full:ready');

    interval = setInterval(() => {
        this._options.auditor.polling.padding = this._options.auditor.polling.padding || 0;
        var currTime = Date.now() + this._options.auditor.polling.padding;

        this.auditModel.popReadyAudits(currTime, (err, auditCursor) => {
          auditCursor.on('error', (err) => {
            Log.error(err.message);
          });

          auditCursor.pipe(this.writeableQueueStream);
        });
      },
      this._options.auditor.polling.interval
    );

  });

  return interval;
};

AuditService.prototype._initQueue = function() {
  var amqpContext = RabbitMQ.createContext(
    this._opts.amqpUrl,
    this._opts.amqpOpts
  );

  amqpContext.on('error', (err) => {
    Log.error(err);
  });

  return amqpContext;
};
