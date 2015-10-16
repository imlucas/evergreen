/* eslint no-sync:0 */
var format = require('util').format;
var path = require('path');
var fs = require('fs');
var untildify = require('untildify');
var mkdirp = require('mkdirp');
var Download = require('download');
var series = require('run-series');
var pkg = require('./package.json');
var debug = require('debug')('evergreen');

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

function bin(name, platform) {
  if (platform === 'windows_64') {
    return name + '.exe';
  }
  return name;
}

exports = {
  client: {}
};

exports.client._dest = function() {
  if (process.env.EVERGREEN_CLIENT_DEST) {
    return untildify(process.env.EVERGREEN_CLIENT_DEST);
  }

  if (process.cwd() === __dirname) {
    return path.join(__dirname, '.evergreen');
  }

  var pkgDirectory = path.join(process.cwd(), 'node_modules', pkg.name);
  var isLocal = fs.existsSync(pkgDirectory);
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
exports.client.version = format('%s_%s', pkg.evergreen.client.sha, pkg.evergreen.client.timestamp);
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
exports.client.url = function(platform, version) {
  platform = normalize(platform);
  version = version || exports.version;

  return format('https://s3.amazonaws.com/mciuploads/mci/cli/mci_%s_client_%s/%s',
    platform, exports.client.version, bin('evergreen', platform));
};

exports.client.binary = path.join(exports.client.dest, bin('evergreen',
  normalize(process.platform)));
debug('client binary will be located at `%s`', exports.client.binary);


function downloadIfNeeded(options, done) {
  debug('checking if download needed', options);
  fs.exists(options.dest, function(exists) {
    if (exists) {
      debug('already have `%s`', options.dest);
      done(null, options.dest);
      return;
    }
    debug('downloading `%s` to `%s`...', options.url, options.dest);
    new Download(options)
      .get(options.url)
      .rename(options.filename)
      .dest(exports.client.dest)
      .run(function(err) {
        if (err) {
          debug('error while downloading:', err);
          done(err);
          return;
        }

        debug('successfully downloaded `%s`', options.dest);
        done(null, options.dest);
      });
  });
}

/**
 * Download the client binary from S3 if we don't already have it.
 *
 * @param {String} [platform] - [Default: `process.platform`].
 * @param {String} [version] - Evergreen client version string
 *   [Default: `require('evergreen').client.version`].
 * @param {Function} done - Callback.
 * @api public
 */
exports.client.download = function(platform, version, done) {
  if (typeof platform === 'function') {
    done = platform;
    platform = undefined;
    version = undefined;
  } else if (typeof version === 'function') {
    done = version;
    version = undefined;
  }
  platform = normalize(platform);
  version = version || exports.version;

  var url = exports.client.url(platform, version);
  var filename = bin('evergreen', platform);
  var options = {
    mode: '755',
    url: url,
    filename: filename,
    dest: path.join(exports.client.dest, filename)
  };

  series([
    mkdirp.bind(null, exports.client.dest),
    downloadIfNeeded.bind(null, options)
  ], done);
};


module.exports = exports;
