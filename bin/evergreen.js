#!/usr/bin/env node

'use strict';

/* eslint no-console: 0 */
const Promise = require('bluebird');
const untildify = require('untildify');
const fs = Promise.promisifyAll(require('fs'));
const evergreen = require('../');
const opn = require('opn');
const execFile = Promise.promisify(require('child_process').execFile);
const config = untildify('~/.evergreen.yml');
const cli = require('mongodb-js-cli')('evergreen');

let setup = () => {
  // Download client binary if need be
  return evergreen.client.download()
    .then(fs.exists(config))
    .then( (exists) => {
      if (!exists) {
        // prompt like Semantic-release:
        // It seems you havent configured evergreen yet!
        // Press ENTER to go to open settings page on evergreen.
        opn('https://evergreen.mongodb.com/settings');
      }
    });
};

// @todo (imlucas): https://github.com/imlucas/mci-trigger/ could be really helpful here :)
// @todo (imlucas): When `mongodb-js-ci` successfully completes a run,
// if `process.env.TRAVIS` and `exists(`pwd`/.evergreen.yml)`,
// submit a new a patch build for this project:
// evergreen patch --project=#{detect project name} --yes --finalize\
//   --description="#{most recent commit message}" --variants=all
//
// @todo (imlucas): Support reading from package.json ->
// autogenerating `.evergreen.yml` for project:
//
// ```json
// {
// "evergreen": {
//     "project": "scout-server"
//   }
// }
// ```
// @todo (imlucas): Wrap client binary calls so output is pretty and actually useful,
// e.g. `WHY IS IT SO HARD TO ADD HUMAN OPTIONS LIKE --open?`
setup()
  .then( () => execFile(evergreen.client.binary, process.argv.slice(2), {stdio: 'inherit'}))
  .then( (stdout) => {
    let msg = stdout.toString('utf-8');

    cli.debug(`execFile stdout is:\n${msg}`);
    let m = new RegExp('Link \: https\:\/\/evergreen.mongodb.com\/patch\/(.*)').exec(msg);

    if (!m) return null;

    let _id = m[1];
    cli.debug(`extracted patch _id ${_id}`);
    const url = `https://evergreen.mongodb.com/version/${_id}`;

    cli.debug(`opening url ${url}`);
    opn(url);
  })
  .catch(cli.abortIfError.bind(cli));
