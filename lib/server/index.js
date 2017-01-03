'use strict';

const Restify = require('restify');
const Mongoose = require('mongoose');
const Errors = require('storj-service-error-types');
const AuditModel = require('../fullauditmodel');
const Log = require('../logger');
const FS = require('fs');
const Assert = require('assert');

function AuditServer(opts) {
  var serverConfig = {
    name: 'storj-service-auditor'
  };

  this._mongoConnection = Mongoose.createConnection(
    this._options.mongo.uri,
    this._options.mongo.options
  );

  this._auditModel = new AuditModel(this._mongoConnection);

  if(opts.server.cert || opts.server.key || opts.server.ca || opts.server.passphrase) {
    serverConfig.httpsServerOptions = (serverConfig.httpsServerOptions) ? serverConfig.httpsServerOptions : {};

    if(opts.server.cert) {
      serverConfig.httpsServerOptions.cert = FS.readFileSync(opts.server.cert);
    }

    if(opts.server.key) {
      serverConfig.httpsServerOptions.key = FS.readFileSync(opts.server.key);
    }

    if(opts.server.ca) {
      serverConfig.httpsServerOptions.ca = opts.server.ca.split(' ').map(function(ca) {
        return FS.readFileSync(ca);
      });
    }

    if(opts.server.passphrase) {
      serverConfig.httpsServerOptions.passphrase = opts.server.passphrase;
    }
  }

  Log.info('starting server...');
  this.server = Restify.createServer(serverConfig);

  this.server.use(Restify.bodyParser({
    maxBodySize: 0,
    mapParams: true,
    mapFiles: false,
    overrideParams: true
  }));

  this.server.listen(
    opts.server.port,
    opts.server.host
  );

  Log.info('listening for audits on: ' + opts.server.host + ':' + opts.server.port);

  this.server.post('/audit-schedule',
    (req, res, next) => {
      req.accepts('application/json');
      try {
        Assert(req.params.farmer_id);
        Assert(req.params.data_hash);
        Assert(req.params.root);
        Assert(req.params.depth);
        Assert(req.params.challenges);
        Assert(req.params.start);
        Assert(req.params.end);
      } catch(err) {
        return next(err);
      }

      return next();
    },

    (req, res, next) => {
      this._auditModel.scheduleFullAudits({
        farmer: req.params.farmer_id,
        hash: req.params.data_hash,
        root: req.params.root,
        depth: req.params.depth,
        challenges: req.params.challenges,
        start: req.params.start,
        end: req.params.end
      }),
      null,
      function(err) {
        if (err) {
          return next(Errors.InternalError);
        }

        res.send(201);
        return next();
      }
    }
  );
}

module.exports = AuditServer;
