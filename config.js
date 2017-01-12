'use strict';

const Config = require('rc')('audits', {
  server: {
    host: '127.0.0.1',
    port: 6541,
    options: {
      name: 'storj-service-auditor',
      certificate: null,
      key: null
    }
  },
  mongo: {
    uri: '127.0.0.1:27017/storj-bridge-database-name',
    options: {
      user: null,
      pass: null,
      ssl: true,
      mongos: {
        ssl: true
      }
    }
  },
  complex: {
    rpcUrl: 'http://localhost:8080',
    rpcUser: null,
    rpcPassword: null
  },
  sleepTime: 5000,
  maxConcurrency: 1000
});

module.exports = Config;
