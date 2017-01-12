'use strict';

const Restify = require('restify');
const Mongoose = require('mongoose');
const Errors = require('storj-service-error-types');
const StorageModels = require('storj-service-storage-models');
const Log = require('../logger');
const FS = require('fs');
const Assert = require('assert');

function AuditServer(opts) {
  this._options = opts;

  this._mongoConnection = Mongoose.createConnection(
    this._options.mongo.uri,
    this._options.mongo.options
  );

  this._storjModels = new StorageModels(this._mongoConnection);

  Log.info('starting server...');
  this.server = Restify.createServer(this._options.server.options);

  this.server.use(Restify.bodyParser({
    maxBodySize: 0,
    mapParams: true,
    mapFiles: false,
    overrideParams: true
  }));

  this.server.listen(
    this._options.server.port,
    this._options.server.host
  );

  Log.info('listening for audits on: ' + this._options.server.host + ':' + this._options.server.port);

  this.server.post('/audit-schedule',
    (req, res, next) => {
      req.accepts('application/json');
      try {
        Assert(req.params.farmer_id);
        Assert(req.params.data_hash);
        Assert(req.params.root);
        Assert(req.params.depth);
        Assert(req.params.challenges && req.params.challenges instanceof Array);
        Assert(req.params.start);
        Assert(req.params.end);
      } catch(err) {
        return next(err);
      }

      return next();
    },

    (req, res, next) => {
      this._storjModels.models.FullAudit.scheduleFullAudits(
        {
          farmer_id: req.params.farmer_id,
          data_hash: req.params.data_hash,
          root: req.params.root,
          depth: req.params.depth,
          challenges: req.params.challenges,
          start: req.params.start,
          end: req.params.end
        },
        null,
        (err) => {
          if (err) {
            return next(Errors.InternalError);
          }

          res.send(201);
          return next();
        }
      );
    }
  );
}

module.exports = AuditServer;
