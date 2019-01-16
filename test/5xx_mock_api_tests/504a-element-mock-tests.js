/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.504-element-mock-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests mock requests of the API controller functionality:
 * GET, POST, PATCH, and DELETE elements.
 */

// NPM modules
const chai = require('chai');
const path = require('path');

// MBEE modules
const ProjController = M.require('controllers.project-controller');
const apiController = M.require('controllers.api-controller');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
let proj = null;
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
   * After: Connect to database. Create an admin user, organization, and project
   */
  before((done) => {
    // Open the database connection
    db.connect()
    // Create test admin
    .then(() => testUtils.createTestAdmin())
    .then((_adminUser) => {
      // Set global admin user
      adminUser = _adminUser;

      // Create organization
      return testUtils.createTestOrg(adminUser);
    })
    .then((retOrg) => {
      // Set global organization
      org = retOrg;

      // Define project data
      const projData = testData.projects[0];

      // Create project
      return ProjController.create(adminUser, org.id, projData);
    })
    .then((retProj) => {
      // Set global project
      proj = retProj;
      projID = utils.parseID(proj[0].id).pop();
      done();
    })
    .catch((error) => {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
      done();
    });
  });

  /**
   * After: Remove Organization and project.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects under organization will also be removed
    testUtils.removeTestOrg(adminUser)
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

  /* Execute tests */
  it('should POST an element', postElement);
  it('should GET an element', getElement);
  it('should PATCH an element', patchElement);
  it('should DELETE an element', deleteElement);
  it('should POST multiple elements', postElements);
  it('should PATCH multiple elements', patchElements);
  it('should GET multiple elements', getElements);
  it('should DELETE multiple elements', deleteElements);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies mock POST request to create an element.
 */
function postElement(done) {
  // Create request object
  const body = testData.elements[0];
  const params = {
    orgid: org.id,
    projectid: projID,
    elementid: testData.elements[0].id
  };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);
  req.query = {
    populate: 'contains'
  };
  // Verifies the response data
  res.send = function send(_data) {
    const postedElem = JSON.parse(_data);
    chai.expect(postedElem.id).to.equal(testData.elements[0].id);
    chai.expect(postedElem.name).to.equal(testData.elements[0].name);
    chai.expect(postedElem.project).to.equal(projID);
    chai.expect(postedElem.org).to.equal(org.id);
    done();
  };

  // POSTs an element
  apiController.postElement(req, res);
}


/**
 * @description Verifies mock GET request to get an element.
 */
function getElement(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: projID,
    elementid: testData.elements[0].id
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.elements[0].name);
    done();
  };

  // GETs an element
  apiController.getElement(req, res);
}

/**
 * @description Verifies mock PATCH request to update an element.
 */
function patchElement(done) {
  // Create request object
  const body = {
    id: testData.elements[0].id,
    name: testData.names[10].name
  };

  const params = {
    orgid: org.id,
    projectid: projID,
    elementid: testData.elements[0].id
  };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.id).to.equal(testData.elements[0].id);
    chai.expect(json.name).to.equal(testData.names[10].name);
    done();
  };

  // PATCHs an element
  apiController.patchElement(req, res);
}

/**
 * @description Verifies mock DELETE request to delete an element.
 */
function deleteElement(done) {
  // Create request object
  const body = {};
  const params = {
    orgid: org.id,
    projectid: projID,
    elementid: testData.elements[0].id
  };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const elementid = JSON.parse(_data);
    chai.expect(elementid).to.equal(testData.elements[0].id);
    done();
  };

  // DELETEs an element
  apiController.deleteElement(req, res);
}

/**
 * @description Verifies mock POST request to create multiple elements.
 */
function postElements(done) {
  // Create request object
  const body = [
    testData.elements[1],
    testData.elements[2],
    testData.elements[3],
    testData.elements[4],
    testData.elements[5],
    testData.elements[6]
  ];
  const params = { orgid: org.id, projectid: projID };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const json = JSON.parse(_data);
    chai.expect(json.length).to.equal(body.length);
    done();
  };

  // POSTs multiple elements
  apiController.postElements(req, res);
}

/**
 * @description Verifies mock PATCH request to update multiple elements.
 */
function patchElements(done) {
  // Create request object
  const arrElemData = [
    testData.elements[1],
    testData.elements[2],
    testData.elements[3],
    testData.elements[4],
    testData.elements[5],
    testData.elements[6]
  ];

  // Create objects to update elements
  const arrUpdateObjects = arrElemData.map(p => ({
    name: `${p.name}_edit`,
    id: p.id
  }));

  const params = { orgid: org.id, projectid: projID };
  const method = 'PATCH';
  const req = testUtils.createRequest(adminUser, params, arrUpdateObjects, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const arrPatchedElem = JSON.parse(_data);
    chai.expect(arrPatchedElem.map(e => e.name)).to.have.members(
      arrUpdateObjects.map(e => e.name)
    );
    done();
  };

  // PATCHs multiple elements
  apiController.patchElements(req, res);
}

/**
 * @description Verifies mock GET request to get multiple elements.
 */
function getElements(done) {
  // Create request object
  const body = {};
  const params = { orgid: org.id, projectid: projID };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const arrElem = JSON.parse(_data);
    chai.expect(arrElem.length).to.equal(11);
    done();
  };

  // GETs multiple elements
  apiController.getElements(req, res);
}

/**
 * @description Verifies mock DELETE request to delete multiple elements.
 */
function deleteElements(done) {
  // Create request object
  const body = [
    testData.elements[1],
    testData.elements[2],
    testData.elements[3],
    testData.elements[4],
    testData.elements[5],
    testData.elements[6]
  ];
  const elemIDs = body.map(e => e.id);

  const params = { orgid: org.id, projectid: projID };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, elemIDs, method);

  // Set response as empty object
  const res = {};

  // Verifies status code and headers
  testUtils.createResponse(res);

  // Verifies the response data
  res.send = function send(_data) {
    const arrDeletedElemIDs = JSON.parse(_data);
    chai.expect(arrDeletedElemIDs.length).to.equal(body.length);
    chai.expect(arrDeletedElemIDs).to.have.members(elemIDs);
    done();
  };

  // DELETEs multiple elements
  apiController.deleteElements(req, res);
}
