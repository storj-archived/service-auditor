'use strict';

const AuditDispatchQueueWorker = require('./auditqueueworker');
const Config = JSON.parse(process.argv.slice(2));

const AuditWorker = new AuditDispatchQueueWorker(Config);

module.exports = AuditWorker;
