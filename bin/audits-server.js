#!/usr/bin/env node
'use strict';
const Config = require('../config');
const AuditServer = require('../lib').server;
new AuditServer(Config);
