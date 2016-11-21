'use strict';

const Restify = require('restify');
const Errors = require('storj-service-error-types');
const AuditService = require('../index');
const Log = require('../logger');
const FS = require('fs');
const Assert = require('assert');

function AuditServer(opts) {
  var serverConfig = {
    name: 'storj-service-auditor'
  };

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

  Log.info('connecting to redis...');
  this._auditor = new AuditService.interface();
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
        //nothing fancy here, V8 can't optimize try-catch blocks
        Assert(req.params.farmer_id);
        Assert(req.params.data_hash);
        Assert(req.params.root);
        Assert(req.params.depth);
        Assert(req.params.challenges);
        Assert(req.params.store_begin);
        Assert(req.params.store_end);
      } catch(err) {
        return next(err);
      }

      return next();
    },

    (req, res, next) => {
      this._auditor.add(
        this._auditor.createAuditJobs({
          farmer: req.params.farmer_id,
          hash: req.params.data_hash,
          root: req.params.root,
          depth: req.params.depth,
          challenges: req.params.challenges,
          start: req.params.store_begin,
          end: req.params.store_end
        }),
        function(err) {
          if (err) {
            return next(Errors.InternalError);
          }

          res.send(201);
          return next();
        });
    }

  );

  this.server.post('/audit',
    (req, res, next) => {
      req.accepts('application/json');
      try {
        //nothing fancy here, V8 can't optimize try-catch blocks
        Assert(req.params.farmer_id);
        Assert(req.params.data_hash);
        Assert(req.params.root);
        Assert(req.params.depth);
        Assert(req.params.challenge);
        Assert(req.params.ts)
      } catch(err) {
        return next(err);
      }

      return next();
    },

    (req, res, next) => {
      this._auditor.add(
        [{
          ts: req.params.ts,
          data: {
            id: req.params.farmer_id,
            root: req.params.root,
            depth: req.params.depth,
            challenge: req.params.challenge,
            hash: req.params.hash
          }
        }],
        function(err) {
          if (err) {
            return next(Errors.InternalError);
          }

          res.send(201);
          return next();
        });
    }
  );
}

module.exports = AuditServer;
