const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const FullAuditModel = new Schema({
  farmer_id:  {
    type: String,
    required: true
  },
  data_hash: {
    type: String,
    required: true
  },
  root: {
    type: String,
    required: true
  },
  depth: {
    type: String,
    required: true
  },
  challenge: {
    type: String,
    required: true
  },
  ts: {
    type: Date,
    required: true,
    index: true
  },
  qProcessing: {
    type: Boolean
  },
  qPassed: {
    type: Boolean
  }
});

FullAuditModel.set('toObject', {
  transform: function(doc, ret) {
    delete ret.qProcessing;
    delete ret.qPassed;
  }
});

FullAuditModel.statics.popReadyAudits = function(count, callback) {
  // Note: Write Performance for WiredTiger mongoDB storage engine will
  // deteriorate while attempting to write to the same docs. For multiple
  // instances of a polling process, create a UUID field for each polling worker
  // to avoid write-lock conflicts.

  var udpateQuery = {
    ts: {
      $gte: Date.now()
    },
    qProcessing: {
      $exists: false
    },
    qPassed: {
      $exists: false
    }
  };

  var updateOperation = {
    $set: {
      qProcessing: true,
      qReturned: false
    }
  };

  var updateOptions = {
    /* may prove too slow for messaging queue
    writeConcern: {
      w: 1,
      j: true
    }
    */
  };

  return this.update(udpateQuery, updateOperation, updateOptions, () => {
    //include polling worker uuid here, when scaled.
    var findQuery = {
      qProcessing: true,
      qPassed: {
        $exists: false
      }
    };

    //Do not use toObject here, use lean: ~3X speed without mongoose docs.
    var findProjection =  {
      qProcessing: false,
      qPassed: false
    };

    return this.find(
      findQuery,
      projection,
      callback
    ).lean().cursor();
  });
}

FullAuditModel.statics.handleAuditResult = function(auditId, result, callback) {
  var udpateQuery = {
    _id: auditId
  };

  var updateOperation = {
    $set: {
      qPassed: result
    },
    $unset: {
      qProcessing: ''
    }
  };

  var updateOptions = {
    /* may prove too slow for messaging queue. Enabling this option here will
      ensure that no returned audit will be lost, yet, so slow...alternative:
      keep collection of unresolved audits to measure impact & don't count
      against farmer for audit.

    writeConcern: {
      w: 1,
      j: true
    }
    */
  };

  return this.update(udpateQuery, updateOperation, updateOptions, callback);
};

module.exports = function(connection) {
  return connection.model('FullAudit', FullAuditModel);
};
