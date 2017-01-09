'use strict';

const Config = require('rc')('audits', {
  server: {
    host: '127.0.0.1',
    port: 6541,
    timeout: 120000,
    cert: null,
    key: null,
    ca: null, //"123, 321"
    passphrase: null,
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
