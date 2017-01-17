#!/usr/bin/env node

const fs = require('fs');
const pify = require('pify');
const exists = pify(fs.exists);

const opn = require('opn');
const cli = require('mongodb-js-cli')('evergreen');

const evergreen = require('../');

function setup() {
  // Download client binary if need be
  return evergreen.downloadCliBinary()
    .then(exists(evergreen.CONFIG_PATH))
    .then((_exists) => {
      cli.debug('Evergreen config file exists at %s? %s', evergreen.CONFIG_PATH, _exists);
      if (!_exists) {
        /**
         * TODO (imlucas) prompt like Semantic-release.
         * "Press ENTER to go to open settings page on evergreen."
         */
        cli.info('It seems you havent configured evergreen yet!');
        opn('https://evergreen.mongodb.com/settings');
      }
    });
}

/**
 * TODO (imlucas) https://github.com/imlucas/mci-trigger/ could be really helpful here :)
 */

/**
 * TODO (imlucas) When `mongodb-js-ci` successfully completes a run,
 * if `process.env.TRAVIS` and `exists(`pwd`/.evergreen.yml)`,
 * submit a new a patch build for this project:
 * evergreen patch --project=#{detect project name} --yes --finalize\
 *   --description="#{most recent commit message}" --variants=all
 */

/**
 * TODO (imlucas): Support reading from package.json ->
 * autogenerating `.evergreen.yml` for project:
 *
 * ```json
 * {
 * "evergreen": {
 *     "project": "scout-server"
 *   }
 * }
 * ```
 */

/**
 * TODO (imlucas) Wrap client binary calls so output is pretty and actually useful,
 * e.g. `WHY IS IT SO HARD TO ADD HUMAN OPTIONS LIKE --open?`
 */
setup().then(evergreen.exec).then(function(res) {
  cli.debug('response from cli:', res);
  if (res.url) {
    cli.debug('opening %s in browser', res.url);
    opn(res.url);
  }
}).catch((err) => cli.abortIfError(err));
