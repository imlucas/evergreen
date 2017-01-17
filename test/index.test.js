'use strict';
/* eslint no-sync: 0 */

const evergreen = require('../');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('evergreen', () => {
  describe('cli', () => {
    describe('url', () => {
      it('should return the right download URL for `darwin`', () => {
        assert.equal(evergreen.getCliUrl('darwin'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_osx_client_'
          + '56310520e80db964c0bfe0b3f0bb81f0f6238f67_16_02_16_00_59_07/evergreen'
        );
      });
      it('should return the right download URL for `linux`', () => {
        assert.equal(evergreen.getCliUrl('linux'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_ubuntu_client_'
          + '56310520e80db964c0bfe0b3f0bb81f0f6238f67_16_02_16_00_59_07/evergreen'
        );
      });
      it('should return the right download URL for `win32`', () => {
        assert.equal(evergreen.getCliUrl('win32'),
          'https://s3.amazonaws.com/mciuploads/mci/cli/mci_windows_64_client_'
          + '56310520e80db964c0bfe0b3f0bb81f0f6238f67_16_02_16_00_59_07/evergreen.exe'
        );
      });
    });

    describe('download', () => {
      evergreen.CLI_DIRECTORY = path.join(__dirname, 'cli-binaries');
      function shouldHaveCliBinary(done) {
        return function(bin) {
          fs.exists(bin, function(_exists) {
            assert(_exists, bin);
            fs.unlink(bin, done);
          });
        };
      }

      it('should download the binary for `darwin`', function(done) {
        evergreen.downloadCliBinary('darwin')
          .then(shouldHaveCliBinary(done));
      });
      it('should download the binary for `linux`', function(done) {
        evergreen.downloadCliBinary('linux')
          .then(shouldHaveCliBinary(done));
      });
      it('should download the binary for `win32`', function(done) {
        evergreen.downloadCliBinary('win32')
          .then(shouldHaveCliBinary(done));
      });
    });
  });
});
