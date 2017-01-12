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
Start an Audit Worker to send scheduled audits:
```
storj-audits-worker
```
Start the Audit Service Server to schedule audits:
```
storj-audits-server
```

### Programmatic

Add Audits to the Queue (requires https://github.com/Storj/service-storage-models):

```js
const StorageModels = require('storj-service-storage-models')(mongooseConnection);
var auditModel = StorjModels.models.FullAudit;

auditModel.scheduleFullAudits(
  {
    farmer_id: req.params.farmer_id,
    data_hash: req.params.data_hash,
    root: req.params.root,
    depth: req.params.depth,
    challenges: req.params.challenges,
    start: req.params.start,
    end: req.params.end
  },
  aTransformFunctionExampleOrNullForDefaultWhichThisExampleIs,
  (err) => {
    if (err) {
      return next(Errors.InternalError);
    }

    res.send(201);
    return next();
  }
);
//best function name ever
function aTransformFunctionExampleOrNullForDefaultWhichThisExampleIs(opts, ind) {
  var auditOutgoingTime;
  var duration = opts.end - opts.start;
  var increment = duration / opts.challenges.length;

  auditOutgoingTime = Math.round(opts.start + (increment * (ind+1)));
  return auditOutgoingTime;
}

```

### Endpoints
| Route            | Method | Parameters  | Description |
|------------------|--------|-------------|-------------|
| /audit-schedule  | POST   | farmer_id, data_hash, root, depth, challenges, start, end | add a series of audits to the processing queue

Config
------
See config.js for defaults; config options are set by the following rules:
  - command line arguments (parsed by minimist)
  - environment variables prefixed with `audits_`
  - or use "\_\_" to indicate nested properties <br/> _(e.g. `audits_auditor__adapter__host` => `auditor.adapter.host`)_
  - if you passed an option `--config file` then from that file
  - a local `.auditsrc` or the first found looking in `./ ../ ../../ ../../../` etc.
  - `$HOME/.auditsrc`
  - `$HOME/.audits/config`
  - `$HOME/.config/audits`
  - `$HOME/.config/audits/config`
  - `/etc/auditsrc`
  - `/etc/audits/config`
  - the defaults object passed in through config.js.

License
-------

storj-service-auditor - send and retrieve queued storj audit proofs
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
