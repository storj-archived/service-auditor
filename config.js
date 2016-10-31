'use strict';

const Config = require('rc')('storj-service-auditor', {
  server: {
    host: '127.0.0.1',
    port: 6541,
    timeout: 120000,
    cert: null,
    key: null,
    ca: [],
    passphrase: null,
  },

  db: {
    host: '127.0.0.1',
    port: 27017,
    name: 'storj-bridge-database-name',
    user: null,
    pass: null,
    mongos: false,
    ssl: false
  },

  storjClient: {
    rpcUrl: 'http://localhost:8080',
    rpcUser: 'user',
    rpcPassword: 'pass'
  },

  auditor: {
    adapter: {
      type: 'redis',
      host: '127.0.0.1',
      port: 6379,
      password: null
    },

    polling: {
      interval: 10000,
      padding: 1000
    },

    maxConcurrency: 20,
    workers: '123 321',
  }
});

module.exports = Config;
