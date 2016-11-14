#!/usr/bin/env node
'use strict';
const Config = require('../config');
const AuditService = require('../lib').service(Config);
AuditService.createPoll();
