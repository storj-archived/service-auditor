'use strict';

const Restify = require('restify');
const Errors = require('storj-service-error-types');
const AuditService = require('../index');
const Log = require('../logger');
const FS = require('fs');

function AuditServer(opts) {
  var serverConfig = {
    name: 'storj-service-auditor'
  }

  if(opts.server.cert) {
    serverConfig.httpsServerOptions = (serverConfig.httpsServerOptions) ? serverConfig.httpsServerOptions : {};
    serverConfig.httpsServerOptions.cert = FS.readFileSync(opts.server.cert);
  }

  if(opts.server.key) {
    serverConfig.httpsServerOptions = (serverConfig.httpsServerOptions) ? serverConfig.httpsServerOptions : {};
    serverConfig.httpsServerOptions.key = FS.readFileSync(opts.server.key);
  }

  if(opts.server.ca) {
    serverConfig.httpsServerOptions = (serverConfig.httpsServerOptions) ? serverConfig.httpsServerOptions : {};
    serverConfig.httpsServerOptions.ca = opts.server.ca.map(function(ca) {
      return FS.readFileSync(ca);
    });
  }

  if(opts.server.passphrase) {
    serverConfig.httpsServerOptions = (serverConfig.httpsServerOptions) ? serverConfig.httpsServerOptions : {};
    serverConfig.httpsServerOptions.passphrase = opts.server.passphrase;
  }

  Log.info('connecting to redis...')
  this._auditor = new AuditService.interface();
  Log.info('starting server...')
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

  Log.info('listening for audits on: ' + opts.server.host + ':' + opts.server.port)

  this.server.post('/audit',
    (req, res, next) => {
      req.accepts('application/json');
      try {
        //nothing fancy here, V8 can't optimize try-catch blocks
        assert(req.params.farmer_id);
        assert(req.params.data_hash);
        assert(req.params.root);
        assert(req.params.depth);
        assert(req.params.challenges);
        assert(req.params.store_begin);
        assert(req.params.store_end);
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
        function(err, count) {
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
