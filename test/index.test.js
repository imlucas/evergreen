'use strict';
/* eslint no-sync: 0 */

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
      it('should download the binary for `darwin`', () => {
        var binary = path.join(evergreen.client.dest, 'evergreen');
        return evergreen.client.download('darwin').then( () => {
          assert(fs.existsSync(binary));
          fs.unlinkSync(binary);
        });
      });
      it('should download the binary for `linux`', () => {
        if (process.env.TRAVIS) {
          return this.skip();
        }
        var binary = path.join(evergreen.client.dest, 'evergreen');
        return evergreen.client.download('linux').then( () => {
          assert(fs.existsSync(binary));
          fs.unlinkSync(binary);
        });
      });
      it('should download the binary for `win32`', () => {
        if (process.env.TRAVIS) {
          return this.skip();
        }
        var binary = path.join(evergreen.client.dest, 'evergreen.exe');
        return evergreen.client.download('win32').then( () => {
          assert(fs.existsSync(binary));
          fs.unlinkSync(binary);
        });
      });
    });
  });
});
