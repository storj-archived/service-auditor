'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

var sandbox;
var ServerClass;
var server;
var proxyObj;

beforeEach(function () {
  sandbox = sinon.sandbox.create();
  proxyObj = {
    'mongoose': {
      createConnection: sandbox.stub().returns(true)
    },

    '../logger': {
      info: sandbox.stub()
    },

    'restify': {
      createServer: sandbox.stub().returns({
        use: sandbox.stub(),
        listen: sandbox.stub(),
        post: sandbox.stub()
      }),
      bodyParser: sandbox.stub()
    },
    'storj-service-storage-models': sandbox.stub().returns({
      models: {
        FullAudit: {
          scheduleFullAudits: sandbox.stub()
        }
      }
    })
  };

  ServerClass = proxyquire('../lib/server', proxyObj);
  server = new ServerClass({
    mongo: {
      uri: 'test',
      options: 'test'
    },
    server: {
      host: '127.0.0.1',
      port: 6541,
      options: {
        name: 'storj-service-auditor',
        certificate: null,
        key: null
      }
    }
  });
});

afterEach(function () {
  sandbox.restore();
});

describe('Server', function() {
  describe('@constructor', function() {
    it('should create a mongo connection', () => {
      expect(proxyObj['mongoose'].createConnection.called).to.be.true;
      expect(server._mongoConnection).to.exist;
    });

    it('should create a server instance', () => {
      expect(proxyObj['restify'].createServer.called).to.be.true;
      expect(server.server).to.exist;
    });

    it('should listen on the specified port and host', () => {
      expect(proxyObj['restify'].createServer().listen.calledWith(server._options.server.port, server._options.server.host)).to.be.true
    });
  });

  describe('/audit-schedule route', function() {
    it('should return an error if any required params are missing', (done) => {
      proxyObj['restify'].createServer().post.callsArgWith(1, {
          params: {
            farmer_id: false
          },
          accepts: () => {}
        },
        {},
        (err) => {
          expect(err).to.be.an.instanceof(new Error().constructor);
          done();
        }
      );

      server = new ServerClass({
        mongo: {
          uri: 'test',
          options: 'test'
        },
        server: {
          host: '127.0.0.1',
          port: 6541,
          timeout: 120000,
          cert: null,
          key: null,
          ca: null, //"123, 321"
          passphrase: null,
        }
      });
    });

    it('should call the audit model\'s scheduleFullAudits method', () => {
      proxyObj['restify'].createServer().post.callsArgWith(2, {
          params: {
            farmer_id: true,
            data_hash: true,
            root: true,
            depth: true,
            challenges: [],
            start: true,
            end: true
          },
          accepts: () => {}
        },
        {
          send: () => {}
        },
        () => {}
      );

      server = new ServerClass({
        mongo: {
          uri: 'test',
          options: 'test'
        },
        server: {
          host: '127.0.0.1',
          port: 6541,
          timeout: 120000,
          cert: null,
          key: null,
          ca: null, //"123, 321"
          passphrase: null,
        }
      });

      expect(server._storjModels.models.FullAudit.scheduleFullAudits.called).to.be.true;
    });

    it('should return a 201 status code if no errors occur', (done) => {
      var sendStub = sandbox.stub();
      proxyObj['storj-service-storage-models']().models.FullAudit.scheduleFullAudits.callsArgWith(2, null);
      proxyObj['restify'].createServer().post.callsArgWith(2, {
          params: {
            farmer_id: true,
            data_hash: true,
            root: true,
            depth: true,
            challenges: [],
            start: true,
            end: true
          },
          accepts: () => {}
        },
        {
          send: sendStub
        },
        (err) => {
          expect(err).to.not.exist;
          expect(sendStub.calledWith(201)).to.be.true;
          done();
        }
      );

      server = new ServerClass({
        mongo: {
          uri: 'test',
          options: 'test'
        },
        server: {
          host: '127.0.0.1',
          port: 6541,
          timeout: 120000,
          cert: null,
          key: null,
          ca: null, //"123, 321"
          passphrase: null,
        }
      });
    });
  });
});
