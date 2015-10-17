var evergreen = require('../');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

describe('evergreen', function() {
  describe('client', function() {
    describe('url', function() {
      it('should return the right download URL for `darwin`', function() {
        assert.equal(evergreen.client.url('darwin'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_osx_client_'
          + '3010ffda7d09fe404360d6d59dc764bfcf784a59_15_09_17_17_56_12/evergreen'
        );
      });
      it('should return the right download URL for `linux`', function() {
        assert.equal(evergreen.client.url('linux'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_ubuntu_client_'
          + '3010ffda7d09fe404360d6d59dc764bfcf784a59_15_09_17_17_56_12/evergreen'
        );
      });
      it('should return the right download URL for `win32`', function() {
        assert.equal(evergreen.client.url('win32'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_windows_64_client_'
          + '3010ffda7d09fe404360d6d59dc764bfcf784a59_15_09_17_17_56_12/evergreen.exe'
        );
      });
    });

    describe('download', function() {
      it('should download the binary for `darwin`', function(done) {
        var binary = path.join(evergreen.client.dest, 'evergreen');
        evergreen.client.download('darwin', function(err) {
          if (err) {
            return done(err);
          }
          fs.exists(binary, function(exists) {
            assert(exists);
            fs.unlink(binary, done);
          });
        });
      });
      it('should download the binary for `linux`', function(done) {
        if (process.env.TRAVIS) {
          return this.skip();
        }
        var binary = path.join(evergreen.client.dest, 'evergreen');
        evergreen.client.download('linux', function(err) {
          if (err) {
            return done(err);
          }

          fs.exists(binary, function(exists) {
            assert(exists);
            fs.unlink(binary, done);
          });
        });
      });
      it('should download the binary for `win32`', function(done) {
        if (process.env.TRAVIS) {
          return this.skip();
        }
        var binary = path.join(evergreen.client.dest, 'evergreen.exe');
        evergreen.client.download('win32', function(err) {
          if (err) {
            return done(err);
          }

          fs.exists(binary, function(exists) {
            assert(exists);
            fs.unlink(binary, done);
          });
        });
      });
    });
  });
});
