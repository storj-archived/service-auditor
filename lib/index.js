'use strict';

const Assert = require('assert');
const Adapter = require('./adapters');
const AuditInterface = require('./abstractauditinterface');

var config = require('../config');

module.exports.service = function(opts) {
  if(opts) {
    opts = JSON.parse(JSON.stringify(Object.assign({}, config, opts)));
  } else {
    opts = JSON.parse(JSON.stringify(Object.assign({}, config)));
  }

  let type = opts.auditor.adapter.type;
  delete opts.auditor.adapter.type;
  var adapterService = new Adapter[type].service(opts);
  return adapterService;
};

module.exports.interface = function(opts) {
  if(opts) {
    opts = JSON.parse(JSON.stringify(Object.assign({}, config, opts)));
  } else {
    opts = JSON.parse(JSON.stringify(Object.assign({}, config)));
  }

  let type = opts.auditor.adapter.type;
  delete opts.auditor.adapter.type;
  var adapterInterface = new Adapter[type].interface(opts);
  Assert(adapterInterface instanceof AuditInterface);
  return adapterInterface;
}
