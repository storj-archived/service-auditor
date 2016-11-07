
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const noisegen = require('noisegen');
const async = require('async');
const expect = require('chai').expect;
const sinon = require('sinon');
const redis = require('redis');
const proxyquire = require('proxyquire');

const storj = require('storj-lib');
const Complex = require('storj-complex');
const Config = require('../config');
const Audit = require('../lib/index');
const Queue = require('../lib/adapters/redis/queue');
const StorageModels = require('storj-service-storage-models');

describe('Audit/Integration', function() {
  var client = Complex.createClient(Config.storjClient);
  var rClient = redis.createClient(Config.auditor.adapter);
  var cred = {
    email: 'auditwizard@tardis.ooo',
    password: 'password',
  };

  var storjModels = new StorageModels(Config.db);
  var aInterface = Audit.interface(Config.auditor.adapter);
//subscribe to all internal queues for testing
  var subscriber = redis.createClient(Config.auditor.adapter);
  subscriber.subscribe(
    Queue.sharedKeys.backlog,
    Queue.sharedKeys.ready,
    Queue.sharedKeys.pass,
    Queue.sharedKeys.fail,
    'storj:audit:full:pending:123'
  );

  subscriber.on('message', function(channel, msg){
    switch (channel) {
      case Queue.sharedKeys.backlog:
        channel = 'backlog';
        break;
      case Queue.sharedKeys.ready:
        channel = 'ready';
        break;
      case Queue.sharedKeys.pass:
        channel = 'pass';
        break;
      case Queue.sharedKeys.fail:
        channel = 'fail';
        break;
      case 'storj:audit:full:pending:123':
        channel = 'pending';
        break;
    }

    auditResponses[channel].push(msg);

  });

  before(function(done) {
    console.log('                                    ');
    console.log('  ********************************  ');
    console.log('  * SPINNING UP TEST ENVIRONMENT *  ');
    console.log('  * CREATING AND AUDITING SHARDS *  ');
    console.log('  *       GRAB A COCKTAIL!       *  ');
    console.log('  ********************************  ');
    console.log('                                    ');

    //TODO: test environ
    /*Spin-up environment here, then createUser()


    function createUser() {
      client.createUser(cred, function(err, user) {
        if(err) {console.log(err);}
        storage.models.User.findOne({_id: user.id}, function(err, user) {
          if (err) { return done(err); }
          client._request('GET', '/activations/' + user.activator, {}, function(err, user) {
            if (err) { return done(err); }
            client = storj.BridgeClient('http://127.0.0.1:6382', {
              basicauth: cred
            });
            createBucket();
          });
        });
      });
    }

    function createBucket() {
      client.createBucket({
        name: 'BuckyMcBucketface'
      }, function(err, bucket) {
        if (err) { return done(err); }
        makeSomeData(bucket);
      });
    }

    function makeSomeData(bucket) {
      var randomName = crypto.randomBytes(6).toString('hex');
      var filePath = require('os').tmpdir() + '/' + randomName + '.txt';
      var randomio = noisegen({ length: 1024 * 1024 * 32 });
      var target = fs.createWriteStream(filePath);
      target.on('finish', function() {
        client.getBuck, hasAuditseturn done(err); }
          client.createToken(buckets[0].id, 'PUSH', function(err, token) {
            if (err) { return done(err); }
            client.storeFileInBucket(
              buckets[0].id,
              token,
              filePath,
              function(err, entry) {
                if (err) { return done(err); }
                return done();
              }
            );
          });
        });
      });
      randomio.pipe(target);
    }
    */
  });

  after(function(done) {
    //delete all redis keys after
    var allKeys = [];
    for(var key in Queue.sharedKeys) {
      allKeys.push(Queue.sharedKeys[key]);
    }

    allKeys.push(
      'storj:audit:full:pending:123',
      'storj:audit:full:pending:undefined'
    );

    rClient.DEL(allKeys, function() {
      done();
    });
  });

  describe('E2E', function() {
    before(function(done) {
      //TODO: replace with short contracts
      //revise audit timeline
      /*
      var lastTime;
      var command = [Queue.sharedKeys.backlog];

      rClient.ZREVRANGE(
        Queue.sharedKeys.backlog,
        0,
        -1,
        function(err, audits) {
          console.log(audits)
          lastTime = Date.now();
          audits.forEach(function(elem, ind, arr) {
            if(ind === 0 || ind % 2 === 0) {
              lastTime = lastTime + 5000;
              command.push(lastTime);
            } else {
              command.push(elem);
            }
          })

          rClient.ZADD(command, function(err, resp) {
            rClient.ZREVRANGE(
              Queue.sharedKeys.backlog,
              0,
              -1,
              function() {
                awaitAuditProcessing(function() {
                  done();
                })
              });
          });
      });
      */
    });

    it('should create a shedule of audits in the backlog', function() {

    });

    it('should move audits to the ready queue', function() {

    });

    it('should move audits to a worker queue', function() {

    });

    it('should move audits to a final queue', function() {

    });


  });

  describe('Component Failures', function() {
    //tests behavior in case of DB failures
    before(function() {

    });

    it('should restart workers on failure', function() {

    });

    it('should retry failed redis requests, before exiting', function() {

    });

  });

  describe('Farmer Failures', function() {
    //tests behavior in case of Farmer failures
    it('should fail all provided audits', function() {

    });

  });
});
