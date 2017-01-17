#!/usr/bin/env node

const cli = require('mongodb-js-cli')('evergreen-install-cli');
const evergreen = require('../');

evergreen.downloadCliBinary()
  .then((src) => cli.ok(src))
  .catch((err) => cli.abortIfError(err));
