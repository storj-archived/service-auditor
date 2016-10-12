Prerequisites
-------------
* [Redis](http://redis.io/)
* Alternative message queue implementing abstractauditinterface

Installation
------------

### Command Line Interface

```
npm install -g storj-service-auditor
```

### Programmatic

```
npm install storj-service-auditor --save
```

Usage
-----

### Command Line Interface

```
storj-service-auditor
```

### Programmatic

Add Audits to the Queue:

```js
const AuditorInterface = require('storj-service-auditor').interface;
var auditor = new AuditorInterface(/* optional config overrides */);
//convenience method for creating an array of jobs from a contract
var audits = auditor.createAuditJobs({
  farmer: contr.farmer_id,
  hash: contr.data_hash,
  root: auditRecord.root,
  depth: auditRecord.depth,
  challenges: auditRecord.challenges,
  start: contr.store_begin,
  end: contr.store_end
});

auditor.add(audits, function(err, count) {
  //returns an error or the count of successfully added audits
});
```

Listen for Passed and Failed Audits:

```js
const AuditorInterface = require('storj-service-auditor').interface;
var auditor = new AuditorInterface(/* optional config overrides */);
//extends Node's EventEmitter
auditor.on('audit.full.pass', function(audit) {
  //returns an audit object
});

auditor.on('audit.full.fail', function(audit) {
  //returns an audit object
});
```

License
-------

Storj Complex - Manage many renter nodes with remote control capabilities  
Copyright (C) 2016 Storj Labs, Inc

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
