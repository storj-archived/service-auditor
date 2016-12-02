const RabbitMQ = require('rabbit.js');
const mongoose = require('mongoose');
const Complex = require('storj-complex');

function QueueWorker(options) {
  this._options = options;
  
  this._storjClient = Complex.createClient(this._options.storjClient);
  this._amqpContext = RabbitMQ.createContext(
    this._opts.amqpUrl,
    this._opts.amqpOpts
  );

  this._amqpContext.on('ready', () => {
    this.notifier = this._amqpContext.socket('PUBLISH');
    this.worker = this._amqpContext.socket('WORKER');
    this.worker.on('data', () => {

    });
  });

}

module.exports = QueueWorker;
