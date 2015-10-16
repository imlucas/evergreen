#!/usr/bin/env node

/* eslint no-console: 0 */
var untildify = require('untildify');
var fs = require('fs');
var evergreen = require('../');
var opn = require('opn');
var spawn = require('child_process').spawn;
var config = untildify('~/.evergreen.yml');
var debug = require('debug')('evergreen');
function abortIfError(err) {
  if (!err) return;
  console.error(err);
  process.exit(1);
}

function setup(done) {
  // Download client binary if need be
  evergreen.client.download(function(err) {
    if (err) {
      return done(err);
    }

    fs.exists(config, function(exists) {
      if (exists) {
        debug('config file already exists at `%s`', config);
        return done();
      }

      // prompt like Semantic-release:
      // It seems you havent configured evergreen yet!
      // Press ENTER to go to open settings page on evergreen.
      opn('https://evergreen.mongodb.com/settings', function() {
        // prompt:
        // copy and paste the contents of "Authentication" textarea
        // here and press ENTER to continue

        // Write pasted text to ~/.evergreen.yml

        done();
      });
    });
  });
}

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
setup(function(err) {
  abortIfError(err);

  var child = spawn(evergreen.client.binary, process.argv.slice(2), {
    stdio: 'inherit'
  });
  child.on('close', function(code) {
    process.exit(code);
  });
});
