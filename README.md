Prerequisites
-------------
* [Redis](http://redis.io/)
* Alternative message queue implementing abstractauditinterface

Installation
------------
```
npm install storj-service-auditor
```
Navigate to install dir:
```
npm link
```

Usage
-----

### Command Line Interface
Start the Audit Service
```
storj-service-auditor
```
Start the Audit Service Server to listen for incoming audits:
```
storj-service-auditor-server
```

### Programmatic

Add Audits to the Queue:

```js
const Auditor = require('storj-service-auditor');
var auditor = new Auditor.interface(/* optional config overrides */);
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
const Auditor = require('storj-service-auditor');
var auditor = new AuditorInterface.interface(/* optional config overrides */);
//extends Node's EventEmitter
auditor.on('audit.full.pass', function(audit) {
  //returns an audit object
});

auditor.on('audit.full.fail', function(audit) {
  //returns an audit object
});
```
### Endpoints
| Route   | Method | Parameters  | Description |
|---------|--------|-------------|-------------|
| /audit  | POST   | farmer_id, data_hash, root
depth
challenges
store_begin
store_end  

Config
------
See config.js for defaults; config options are set by the following rules:  
&nbsp;&nbsp;  - command line arguments (parsed by minimist)
&nbsp;&nbsp;  - environment variables prefixed with `storj-service-auditor_`
&nbsp;&nbsp;  - or use "\_\_" to indicate nested properties <br/> _(e.g. `storj-service-auditor_foo__bar__baz` => `foo.bar.baz`)_
&nbsp;&nbsp;  - if you passed an option `--config file` then from that file
&nbsp;&nbsp;  - a local `.storj-service-auditorrc` or the first found looking in `./ ../ ../../ ../../../` etc.
&nbsp;&nbsp;  - `$HOME/.storj-service-auditorrc`
&nbsp;&nbsp;  - `$HOME/.storj-service-auditor/config`
&nbsp;&nbsp;  - `$HOME/.config/storj-service-auditor`
&nbsp;&nbsp;  - `$HOME/.config/storj-service-auditor/config`
&nbsp;&nbsp;  - `/etc/storj-service-auditorrc`
&nbsp;&nbsp;  - `/etc/${appname}/config`
&nbsp;&nbsp;  - the defaults object you passed in.

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
