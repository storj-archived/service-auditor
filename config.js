'use strict';

const Config = require('rc')('audits', {
  server: {
    host: '127.0.0.1',
    port: 6541,
    timeout: 120000,
    cert: null,
    key: null,
    ca: [],
    passphrase: null,
  },

  mongo: {
    uri: '127.0.0.1:27017/storj-bridge-database-name',
    options: {
      user: null,
      pass: null
    }
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
    uuid: '123',
  }
});

module.exports = Config;
