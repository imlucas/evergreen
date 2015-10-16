#!/usr/bin/env node
/* eslint no-console: 0 */
var download = require('../').client.download;

download(function(err, src) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(src);
  process.exit(0);
});
