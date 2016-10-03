'use strict';

var assert = require('assert');
const Adapter = require('./adapters');
const AuditInterface = require('./abstractauditinterface');

var config = require('../config');

module.exports.service = function(opts) {
  if(typeof opts === 'object') {
    opts = JSON.parse(JSON.stringify(Object.assign({}, config, opts)));
  }

  let type = opts.adapter.type;
  delete opts.adapter.type;

  var adapterService = new Adapter[type].service(opts);
  return adapterService;
};

module.exports.interface = function(opts) {
  if(typeof opts === 'object') {
    opts = JSON.parse(JSON.stringify(Object.assign({}, config, opts)));
  }

  let type = opts.adapter.type;
  delete opts.adapter.type;

  var adapterInterface = new Adapter[type].interface(opts);
  assert(adapterInterface instanceof AuditInterface);
  return adapterInterface;
}
