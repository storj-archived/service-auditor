#!/usr/bin/env node
'use strict';
const Config = require('../config');
const AuditService = require('../lib').worker;

var worker = new AuditService(Config);
worker.start();
