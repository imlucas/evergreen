'use strict';

/* eslint no-sync:0 */
const Promise = require('bluebird');
const path = require('path');
const exists = (src) => {
  return new Promise((resolve) => {
    require('fs').exists(src, resolve);
  });
};

const existsSync = require('fs').existsSync;
const untildify = require('untildify');
const mkdirp = Promise.promisify(require('mkdirp'));
const Download = require('download');
const pkg = require('./package.json');
const debug = require('debug')('evergreen');

let normalize = (platform) => {
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
};

let bin = (name, platform) => {
  if (platform === 'windows_64') {
    return name + '.exe';
  }
  return name;
};

exports = {
  client: {}
};

exports.client._dest = () => {
  if (process.env.EVERGREEN_CLIENT_DEST) {
    return untildify(process.env.EVERGREEN_CLIENT_DEST);
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

  // We're probably a devDependency so keep client builds local
  // which is great for taking advantage of Travis and Evergreen
  // directory caching between builds.
  return path.join(pkgDirectory, '.evergreen');
};


/**
 * Where the client binaries will be downloaded to.
 * @api public
 */
exports.client.dest = exports.client._dest();
debug('client binaries will be downloaded to `%s`', exports.client.dest);

/**
 * The current version of the evergreen client.
 * @api public
 */
exports.client.version = `${pkg.evergreen.client.sha}_${pkg.evergreen.client.timestamp}`;
debug('client version is `%s`', exports.client.version);

/**
 * What is the S3 URL I should use to download the client binary?
 *
 * @param {String} [platform] - [Default: `process.platform`].
 * @param {String} [version] - Evergreen client version string
 *   [Default: `require('evergreen').client.version`].
 * @return {String} - The URL
 * @api public
 */
exports.client.url = (platform, version) => {
  version = version || exports.client.version;

  return `https://s3.amazonaws.com/mciuploads/mci/cli/mci_`
    + `${normalize(platform)}_client_${version}/${bin('evergreen', normalize(platform))}`;
};

exports.client.binary = path.join(exports.client.dest,
  bin('evergreen', normalize(process.platform)));
debug(`client binary will be located at ${exports.client.binary}`);


function downloadIfNeeded(options) {
  debug('checking if download needed', options);
  return exists(options.dest)
    .then( (_exists) => {
      if (_exists) {
        debug(`already have ${options.dest}`);
        return options.dest;
      }
      debug(`downloading ${options.url} to ${options.dest}...`);

      return new Promise((resolve, reject) => {
        new Download(options)
          .get(options.url)
          .rename(options.filename)
          .dest(exports.client.dest)
          .run((err) => {
            debug('download complete', err);
            if (err) return reject(err);
            resolve(options.dest);
          });
      });
    });
}

/**
 * Download the client binary from S3 if we don't already have it.
 *
 * @param {String} [platform] - [Default: `process.platform`].
 * @param {String} [version] - Evergreen client version string
 *   [Default: `require('evergreen').client.version`].
 * @return {Promise}
 * @api public
 */
exports.client.download = function(platform, version) {
  platform = normalize(platform);
  version = version || exports.client.version;

  const url = exports.client.url(platform, version);
  const filename = bin('evergreen', platform);
  const options = {
    mode: '755',
    url: url,
    filename: filename,
    dest: path.join(exports.client.dest, filename)
  };

  return mkdirp(exports.client.dest)
    .then(() => downloadIfNeeded(options));
};


module.exports = exports;
