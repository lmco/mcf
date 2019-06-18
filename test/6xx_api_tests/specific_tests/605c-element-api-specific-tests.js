/**
 * Classification: UNCLASSIFIED
 *
 * @module test.605a-element-api-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description This tests the element API controller functionality:
 * GET, POST, PATCH, and DELETE of an element.
 */

// NPM modules
const chai = require('chai');
const request = require('request');
const path = require('path');
const fs = require('fs');

// MBEE modules
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const test = M.config.test;
const zipFile = 'test/test_zip_data.json.gz';
let org = null;
let adminUser = null;
let projID = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin, organization, and project.
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((user) => {
      // Set admin global user
      adminUser = user;

      // Create org
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      org = retOrg;

      // Create project
      return testUtils.createTestProject(adminUser, org.id);
    })
    .then((retProj) => {
      projID = utils.parseID(retProj.id).pop();
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error.message).to.equal(null);
      done();
    });
  });

  /**
   * After: Delete organization and admin user
   */
  after((done) => {
    // Delete organization
    testUtils.removeTestOrg(adminUser)
    // Delete admin user
    .then(() => testUtils.removeTestAdmin())
    .then(() => db.disconnect())
    .then(() => done())
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /* Execute the tests */
  it('should create elements from an uploaded gzip file', handleGzipUpload);
});

/* --------------------( Tests )-------------------- */

/**
 * @description Verifies that a gzip file can be uploaded, unzipped, and
 * the contents can be used to create elements.
 */
function handleGzipUpload(done) {
  const elemData = testData.elements[0];
  request({
    url: `${test.url}/api/orgs/${org.id}/projects/${projID}/branches/master/elements`,
    // Send the 'application/gzip' header
    headers: testUtils.getHeaders('application/gzip'),
    ca: testUtils.readCaFile(),
    method: 'POST',
    // Send a zip file containing element data in the body
    body: fs.createReadStream(path.join(M.root, zipFile))
  },
  (err, response, body) => {
    // Expect no error
    chai.expect(err).to.equal(null);
    // Expect response status: 200 OK
    chai.expect(response.statusCode).to.equal(200);
    // Verify response body
    const createdElement = JSON.parse(body);

    // Verify element created properly
    chai.expect(createdElement.id).to.equal(elemData.id);
    chai.expect(createdElement.name).to.equal(elemData.name);
    chai.expect(createdElement.custom || {}).to.deep.equal(elemData.custom);
    chai.expect(createdElement.project).to.equal(projID);

    done();
  });
}
