'use strict';

const evergreen = require('../');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('evergreen', () => {
  describe('client', () => {
    describe('url', () => {
      it('should return the right download URL for `darwin`', () => {
        assert.equal(evergreen.client.url('darwin'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_osx_client_'
          + '56310520e80db964c0bfe0b3f0bb81f0f6238f67_16_02_16_00_59_07/evergreen'
        );
      });
      it('should return the right download URL for `linux`', () => {
        assert.equal(evergreen.client.url('linux'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_ubuntu_client_'
          + '56310520e80db964c0bfe0b3f0bb81f0f6238f67_16_02_16_00_59_07/evergreen'
        );
      });
      it('should return the right download URL for `win32`', () => {
        assert.equal(evergreen.client.url('win32'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_windows_64_client_'
          + '56310520e80db964c0bfe0b3f0bb81f0f6238f67_16_02_16_00_59_07/evergreen.exe'
        );
      });
    });

    describe('download', () => {
      it('should download the binary for `darwin`', (done) => {
        var binary = path.join(evergreen.client.dest, 'evergreen');
        evergreen.client.download('darwin', (err) => {
          if (err) {
            return done(err);
          }
          fs.exists(binary, function(exists) {
            assert(exists);
            fs.unlink(binary, done);
          });
        });
      });
      it('should download the binary for `linux`', (done) => {
        if (process.env.TRAVIS) {
          return this.skip();
        }
        var binary = path.join(evergreen.client.dest, 'evergreen');
        evergreen.client.download('linux', (err) => {
          if (err) {
            return done(err);
          }

          fs.exists(binary, function(exists) {
            assert(exists);
            fs.unlink(binary, done);
          });
        });
      });
      it('should download the binary for `win32`', (done) => {
        if (process.env.TRAVIS) {
          return this.skip();
        }
        var binary = path.join(evergreen.client.dest, 'evergreen.exe');
        evergreen.client.download('win32', (err) => {
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
