const restify = require('restify');
const errors = require('storj-service-error-types');
const config = require('./config');
const auditInterface = require('./lib/index').interface;

function AuditServer() {
  this._auditor = new auditInterface();
  this.server = restify.createServer({
    name: 'service-auditor'
  });

  server.use(restify.bodyParser({
    maxBodySize: 0,
    mapParams: true,
    mapFiles: false,
    overrideParams: true
  }));

  server.post('/audit',
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
            return next(errors.InternalError);
          }

          res.send(201);
          return next();
        });
    }

  );
}

module.exports = AuditServer;
