'use strict';

const AuditDispatchQueueWorker = require('./auditqueueworker');
const Config = JSON.parse(process.argv.slice(2));

new AuditDispatchQueueWorker(Config);
