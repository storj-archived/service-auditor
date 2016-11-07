'use strict';

const Assert = require('assert');
const Adapter = require('./adapters');
const AuditInterface = require('./abstractauditinterface');
const Config = require('../config');
const Server = require('./server');

module.exports.service = function(opts) {
  opts = _copy(Config, opts);
  let type = opts.auditor.adapter.type;
  delete opts.auditor.adapter.type;
  var adapterService = new Adapter[type].service(opts);
  return adapterService;
};

module.exports.interface = function(opts) {
  opts = _copy(Config, opts);
  let type = opts.auditor.adapter.type;
  delete opts.auditor.adapter.type;
  var adapterInterface = new Adapter[type].interface(opts.auditor.adapter);
  Assert(adapterInterface instanceof AuditInterface);
  return adapterInterface;
};

module.exports.server = function(opts) {
  opts = _copy(Config, opts);
  delete opts.auditor.adapter.type;
  var server = new Server(opts);
  return server;
};

function _copy(src, add){
  if(add) {
    return JSON.parse(JSON.stringify(Object.assign({}, src, add)));
  } else {
    return JSON.parse(JSON.stringify(Object.assign({}, src)));
  }
}
