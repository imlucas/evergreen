'use strict';

/* eslint no-sync:0 */
const pify = require('pify');
const execFile = pify(require('child_process').execFile);
const path = require('path');
const fs = require('fs');
const existsSync = fs.existsSync;
const write = pify(fs.writeFile);

const untildify = require('untildify');
const download = require('download');

const pkg = require('./package.json');
const debug = require('debug')('evergreen');

const exists = pify(fs.exists);
const chmod = pify(fs.chmod);
const mkdirp = pify(require('mkdirp'));

function normalize(platform) {
  if (!platform) {
    platform = process.platform;
  }

  if (platform === 'darwin' || platform === 'osx') {
    platform = 'osx';
  } else if (platform === 'win32' || platform === 'windows_64') {
    platform = 'windows_64';
  } else {
    platform = 'ubuntu';
  }
  return platform;
}

function bin(filename, platform) {
  if (platform === 'windows_64') {
    return `${filename}.exe`;
  }
  return filename;
}

exports.CONFIG_PATH = untildify('~/.evergreen.yml');

/**
 * The current version of the evergreen cli.
 * @api public
 */
exports.CLI_VERSION = [
  pkg.evergreen.cli.sha,
  pkg.evergreen.cli.timestamp
].join('_');

debug('CLI version is `%s`', exports.CLI_VERSION);

/**
 * Directory the cli binaries will be downloaded to.
 *
 * @returns {String}
 * @api public
 */
exports.getCliDirectory = function() {
  if (process.env.EVERGREEN_CLI_DIRECTORY) {
    return untildify(process.env.EVERGREEN_CLI_DIRECTORY);
  }

  if (process.cwd() === __dirname) {
    return path.join(__dirname, '.evergreen');
  }

  const pkgDirectory = path.join(process.cwd(), 'node_modules', pkg.name);
  const isLocal = existsSync(pkgDirectory);
  if (!isLocal) {
    // We're installed globally so keep artifacts at the user level.
    return untildify('~/.evergreen');
  }

  // We're probably a devDependency so keep cli binaries local
  // which is great for taking advantage of Travis and Evergreen
  // directory caching between builds.
  return path.join(pkgDirectory, '.evergreen');
};

exports.CLI_DIRECTORY = exports.getCliDirectory();
debug('cli binaries will be downloaded to `%s`', exports.CLI_DIRECTORY);

/**
 * What is the S3 URL I should use to download the cli binary?
 *
 * @param {String} [platform] - [Default: `process.platform`].
 * @param {String} [version] - Evergreen cli version string
 *   [Default: `require('evergreen').CLI_VERSION`].
 * @return {String} - The URL
 * @api public
 */
exports.getCliUrl = function(platform, version) {
  version = version || exports.CLI_VERSION;

  return `https://s3.amazonaws.com/mciuploads/mci/cli/mci_`
    + `${normalize(platform)}_client_${version}/${bin('evergreen', normalize(platform))}`;
};

exports.getCliPath = function(platform, directory) {
  platform = normalize(platform || process.platform);
  directory = directory || exports.CLI_DIRECTORY;

  return path.join(directory, bin('evergreen', platform));
};

exports.CLI_PATH = exports.getCliPath();
debug(`cli binary will be located at ${exports.CLI_PATH}`);


function downloadIfNeeded(platform, version) {
  platform = normalize(platform);
  version = version || exports.CLI_VERSION;

  const url = exports.getCliUrl(platform, version);
  const dest = exports.getCliPath(platform);

  debug('checking if download needed', {url: url, dest: dest});
  return new Promise(function(resolve, reject) {
    fs.exists(dest, function(_exists) {
      if (_exists) {
        debug('already have %s', dest);
        return resolve(dest);
      }
      debug('downloading...', {
        url: url,
        dest: dest
      });

      return download(url).then(data => {
        debug('writing', dest);
        return write(dest, data);
      })
      .then(function() {
        debug('chmod', dest);
        return chmod(dest, '755');
      })
      .then(function() {
        resolve(dest);
      })
      .catch(reject);
    });
  });
}

/**
 * Download the cli binary from S3 if we don't already have it.
 *
 * @param {String} [platform] - [Default: `process.platform`].
 * @param {String} [version] - Evergreen cli version string
 *   [Default: `require('evergreen').CLI_VERSION`].
 * @return {Promise}
 * @api public
 */
exports.downloadCliBinary = function(platform, version) {
  return mkdirp(exports.CLI_DIRECTORY).then(function() {
    return downloadIfNeeded(platform, version);
  });
};

/**
 * @typedef {Object} PatchResponse
 * @property {String} method
 * @property {String} patch_id
 * @property {String} url
 */
const PATCH_URL_RE = new RegExp('Link \: https\:\/\/evergreen.mongodb.com\/patch\/(.*)');

/**
 * @param {Buffer} stdout
 * @returns {Promise.PatchResponse}
 * @api private
 */
exports.parseCliOutput = function(stdout) {
  return new Promise(function(resolve) {
    debug('parsing cli output', stdout.toString('utf-8'));

    const res = {};
    const patchUrlMatches = PATCH_URL_RE.exec(stdout.toString('utf-8'));
    if (patchUrlMatches) {
      Object.assign(res, {
        method: 'patch',
        patch_id: patchUrlMatches[1],
        url: `https://evergreen.mongodb.com/version/${patchUrlMatches[1]}`
      });
    }
    debug('parsed cli output is', res);
    resolve(res);
  });
};

/**
 * Run the evergreen cli binary.
 *
 * @return {Promise} Parsed cli output
 * @api public
 */
exports.exec = function() {
  const args = process.argv.slice(2);
  debug('running', {
    bin: exports.CLI_PATH,
    args: args
  });
  return execFile(exports.CLI_PATH, args, {stdio: 'inherit'})
    .then(exports.parseCliOutput);
};

module.exports = exports;
