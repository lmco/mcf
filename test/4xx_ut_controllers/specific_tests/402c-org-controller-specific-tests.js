/**
 * Classification: UNCLASSIFIED
 *
 * @module test.402c-org-controller-specific-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description These tests test for specific use cases within the org
 * controller. The tests verify that operations can be done that are more
 * specific than the core tests.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const Organization = M.require('models.organization');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let orgs = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin user.
   */
  before(async () => {
    try {
      // Connect to the database
      await db.connect();
      // Create test admin
      adminUser = await testUtils.createTestAdmin();

      // Create orgs for the tests to utilize
      orgs = await OrgController.create(adminUser, testData.orgs);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Delete admin user.
   */
  after(async () => {
    try {
      // Removing admin user
      await Organization.deleteMany({ _id: orgs.map((o) => o._id) });
      await testUtils.removeTestAdmin();
      await db.disconnect();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute the tests */
  // -------------- Find --------------
  it('should populate find results', optionPopulateFind);
  it('should include archived orgs in the find results', optionIncludeArchivedFind);
  it('should only return the specified fields', optionFieldsFind);
  it('should limit the number of search results', optionLimitFind);
  it('should skip over find results', optionSkipFind);
  it('should return a raw JSON version of an org instead of a document with'
    + ' instance methods from find()', optionLeanFind);
  it('should sort find results', optionSortFind);
  it('should find an org with a specific name', optionNameFind);
  it('should find an org created by a specific user', optionCreatedByFind);
  it('should find an org last modified by a specific user', optionLastModifiedByFind);
  it('should only find archived orgs', optionArchivedFind);
  it('should find an org archived by a specific user', optionArchivedByFind);
  it('should find an org based on its custom data', optionCustomFind);
  // ------------- Create -------------
  it('should populate the return object from create', optionPopulateCreate);
  it('should only return specified fields from create', optionFieldsCreate);
  it('should return a raw JSON version of an org instead of a document with'
    + ' instance methods from create()', optionLeanCreate);
  // ------------- Update -------------
  it('should populate the return object from update', optionPopulateUpdate);
  it('should only return specified fields from update', optionFieldsUpdate);
  it('should return a raw JSON version of an org instead of a document with'
    + ' instance methods from update()', optionLeanUpdate);
  // ------------- Replace ------------
  it('should populate the return object from createOrReplace', optionPopulateReplace);
  it('should only return specified fields from createOrReplace', optionFieldsReplace);
  it('should return a raw JSON version of an org instead of a document with'
    + ' instance methods from createOrReplace()', optionLeanReplace);
  // ------------- Remove -------------
});

/* --------------------( Tests )-------------------- */
/**
 * @description Validates that the find results can be populated
 */
async function optionPopulateFind() {
  try {
    // Select a org to test
    const org = orgs[1];

    // Get populate options, without archivedBy because this org isn't archived
    let fields = Organization.getValidPopulateFields();
    fields = fields.filter((f) => f !== 'archivedBy');
    const options = { populate: fields };

    // Perform a find on the org
    const foundOrgs = await OrgController.find(adminUser, org.id, options);
    // There should be one org
    chai.expect(foundOrgs.length).to.equal(1);
    const foundOrg = foundOrgs[0];

    // Check that each populated field was returned as an object
    fields.forEach((field) => {
      chai.expect(typeof foundOrg[field] === 'object').to.equal(true);
      chai.expect(foundOrg[field]).to.not.equal(null);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the find results can be include archived results
 */
async function optionIncludeArchivedFind() {
  try {
    // Select orgs to test
    const org = orgs[1];
    const orgID = org.id;
    const archivedOrg = orgs[2];
    const archivedID = archivedOrg.id;

    // Create find option
    const options = { includeArchived: true };

    // Archive the second org
    const archiveUpdate = {
      id: archivedID,
      archived: true
    };
    await OrgController.update(adminUser, archiveUpdate);

    // Perform a find on the orgs
    const foundOrg = await OrgController.find(adminUser, [orgID, archivedID]);
    // There should be one org
    chai.expect(foundOrg.length).to.equal(1);
    chai.expect(foundOrg[0]._id).to.equal(org._id);

    // Perform a find on the orgs
    const foundOrgs = await OrgController.find(adminUser,
      [orgID, archivedID], options);
    // There should be two orgs
    chai.expect(foundOrgs.length).to.equal(2);
    chai.expect(foundOrgs[0]._id).to.equal(org._id);
    chai.expect(foundOrgs[1]._id).to.equal(archivedOrg._id);

    // Clean up for the following tests
    archiveUpdate.archived = false;
    await OrgController.update(adminUser, archiveUpdate);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the find results only return specified fields
 */
async function optionFieldsFind() {
  try {
    // Select a org to test
    const org = orgs[1];
    const orgID = org.id;

    // Create fields option
    const fields = ['name', 'permissions'];
    const options = { fields: fields, lean: true };

    // Perform a find on the org
    const foundOrgs = await OrgController.find(adminUser, orgID, options);
    // There should be one org
    chai.expect(foundOrgs.length).to.equal(1);
    const foundOrg = foundOrgs[0];

    const keys = Object.keys(foundOrg);
    // +1 because the _id field is always returned no matter what
    chai.expect(keys.length).to.equal(fields.length + 1);
    // Check that only the specified fields have been returned
    fields.forEach((field) => {
      chai.expect(keys.includes(field)).to.equal(true);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the number of find results can be limited
 */
async function optionLimitFind() {
  try {
    // Create limit option
    const options = { limit: 2 };

    // Find all the orgs with the limit option
    const limitOrgs = await OrgController.find(adminUser, options);
    // There should only be as many orgs as specified in the limit option
    chai.expect(limitOrgs.length).to.equal(options.limit);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that find results can be skipped over
 */
async function optionSkipFind() {
  try {
    // Create skip option
    const options = { skip: 3 };

    // Find all the orgs to get the total number
    const allOrgs = await OrgController.find(adminUser);
    const numOrgs = allOrgs.length;

    // Find all the orgs with the skip option
    const skipOrgs = await OrgController.find(adminUser, options);
    chai.expect(skipOrgs.length).to.equal(numOrgs - options.skip);

    // Check that the first 3 orgs were skipped
    chai.expect(skipOrgs[0]._id).to.equal(allOrgs[3]._id);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that find results can return raw JSON rather than models
 */
async function optionLeanFind() {
  try {
    // Create lean option
    const options = { lean: true };

    // Find the orgs without lean to check that they are models
    const foundOrgs = await OrgController.find(adminUser);
    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof foundOrgs[0].getValidUpdateFields).to.equal('function');

    // Find the orgs with the lean option
    const leanOrgs = await OrgController.find(adminUser, options);
    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof leanOrgs[0].getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the returned search results
 * from findOrg can be sorted
 */
function optionSortFind(done) {
  // Create the test org objects
  const testOrg0 = {
    id: 'testorg000',
    name: 'b'
  };
  const testOrg1 = {
    id: 'testorg001',
    name: 'c'
  };
  const testOrg2 = {
    id: 'testorg002',
    name: 'a'
  };
  // Create sort options
  const sortOption = { sort: 'name' };
  const sortOptionReverse = { sort: '-name' };

  // Create the orgs
  OrgController.create(adminUser, [testOrg0, testOrg1, testOrg2])
  .then((createdOrgs) => {
    // Expect createdOrgs array to contain 3 orgs
    chai.expect(createdOrgs.length).to.equal(3);

    return OrgController.find(adminUser, [testOrg0.id, testOrg1.id, testOrg2.id], sortOption);
  })
  .then((foundOrgs) => {
    // Expect to find 3 orgs
    chai.expect(foundOrgs.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(foundOrgs[0].name).to.equal('a');
    chai.expect(foundOrgs[0].id).to.equal('testorg002');
    chai.expect(foundOrgs[1].name).to.equal('b');
    chai.expect(foundOrgs[1].id).to.equal('testorg000');
    chai.expect(foundOrgs[2].name).to.equal('c');
    chai.expect(foundOrgs[2].id).to.equal('testorg001');

    // Find the orgs and return them sorted in reverse
    return OrgController.find(adminUser, [testOrg0.id, testOrg1.id, testOrg2.id],
      sortOptionReverse);
  })
  .then((foundOrgs) => {
    // Expect to find 3 orgs
    chai.expect(foundOrgs.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(foundOrgs[0].name).to.equal('c');
    chai.expect(foundOrgs[0].id).to.equal('testorg001');
    chai.expect(foundOrgs[1].name).to.equal('b');
    chai.expect(foundOrgs[1].id).to.equal('testorg000');
    chai.expect(foundOrgs[2].name).to.equal('a');
    chai.expect(foundOrgs[2].id).to.equal('testorg002');
  })
  .then(() => OrgController.remove(adminUser, [testOrg0.id, testOrg1.id, testOrg2.id]))
  .then(() => done())
  .catch((error) => {
    M.log.error(error.message);
    // Expect no errors
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Validates that orgs with a specific name can be found
 */
async function optionNameFind() {
  try {
    // Create name option
    const options = { name: 'Test Organization 01' };

    // Find the org
    const foundOrgs = await OrgController.find(adminUser, options);

    // There should be one org found
    chai.expect(foundOrgs.length).to.equal(1);
    const foundOrg = foundOrgs[0];

    // Validate that the correct org has been found
    chai.expect(foundOrg.name).to.equal('Test Organization 01');
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that orgs created by a specific user can be found
 */
async function optionCreatedByFind() {
  try {
    // Create createdBy option
    const options = { createdBy: 'test_admin' };

    // Find the org
    const foundOrgs = await OrgController.find(adminUser, options);

    // Validate that each org was created by the test admin
    foundOrgs.forEach((org) => {
      chai.expect(org.createdBy).to.equal('test_admin');
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that orgs last modified by a specific user can be found
 */
async function optionLastModifiedByFind() {
  try {
    // Create lastModifiedBy option
    const options = { lastModifiedBy: 'test_admin' };

    // Find the org
    const foundOrgs = await OrgController.find(adminUser, options);

    // Validate that each org was created by the test admin
    foundOrgs.forEach((org) => {
      chai.expect(org.lastModifiedBy).to.equal('test_admin');
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that only archived orgs will be returned with the archived option
 */
async function optionArchivedFind() {
  try {
    // Select orgs to test
    const org = orgs[1];
    const orgID = org.id;
    const archivedOrg = orgs[2];
    const archivedID = utils.parseID(archivedOrg.id).pop();

    // Create find option
    const options = { archived: true };

    // Archive the second org
    const archiveUpdate = {
      id: archivedID,
      archived: true
    };
    await OrgController.update(adminUser, archiveUpdate);

    // Perform a find on the orgs
    const foundOrgs = await OrgController.find(adminUser,
      [orgID, archivedID]);
    // There should be one unarchived org
    chai.expect(foundOrgs.length).to.equal(1);
    chai.expect(foundOrgs[0]._id).to.equal(org._id);
    chai.expect(foundOrgs[0].archived).to.equal(false);

    // Perform a find on the orgs
    const archivedOrgs = await OrgController.find(adminUser,
      [orgID, archivedID], options);
    // There should be one archived org
    chai.expect(archivedOrgs.length).to.equal(1);
    chai.expect(archivedOrgs[0]._id).to.equal(archivedOrg._id);
    chai.expect(archivedOrgs[0].archived).to.equal(true);

    // Clean up for the following tests
    archiveUpdate.archived = false;
    await OrgController.update(adminUser, archiveUpdate);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that orgs archived by a specific user can be found
 */
async function optionArchivedByFind() {
  try {
    // Archive a org
    const update = {
      id: utils.parseID(orgs[0]._id).pop(),
      archived: true
    };
    await OrgController.update(adminUser, update);

    // Create archivedBy option
    const options = { archivedBy: 'test_admin' };

    // Find the org
    const foundOrgs = await OrgController.find(adminUser, options);

    // Validate that each org was archived by the test admin
    foundOrgs.forEach((org) => {
      chai.expect(org.archivedBy).to.equal('test_admin');
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that orgs with specific custom data can be found
 */
async function optionCustomFind() {
  try {
    // Create custom option
    const options = { 'custom.leader': 'Test Leader 01' };

    // Find the org
    const foundOrgs = await OrgController.find(adminUser, options);
    // There should be one org found
    chai.expect(foundOrgs.length).to.equal(1);
    const foundOrg = foundOrgs[0];

    // Validate the found org has the custom data
    chai.expect(foundOrg.custom).to.deep.equal({ leader: 'Test Leader 01' });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the return object from create() can be populated
 */
async function optionPopulateCreate() {
  try {
    // Select a org to test
    const orgID = utils.parseID(orgs[1]._id).pop();
    const orgObj = {
      id: orgID,
      name: 'Org01'
    };

    // Delete the org
    await OrgController.remove(adminUser, orgID);

    // Get populate options, without archivedBy because this org isn't archived
    let fields = Organization.getValidPopulateFields();
    fields = fields.filter((f) => f !== 'archivedBy');
    const options = { populate: fields };

    // Create the org
    const createdOrgs = await OrgController.create(adminUser, orgObj, options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const createdOrg = createdOrgs[0];

    // Check that each populated field was returned as an object
    fields.forEach((field) => {
      chai.expect(typeof createdOrg[field] === 'object').to.equal(true);
      chai.expect(createdOrg[field]).to.not.equal(null);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the create results only return specified fields
 */
async function optionFieldsCreate() {
  try {
    // Select a org to test
    const orgID = utils.parseID(orgs[1]._id).pop();
    const orgObj = {
      id: orgID,
      name: 'Org01'
    };

    // Delete the org
    await OrgController.remove(adminUser, orgID);

    // Create fields option
    const fields = ['name', 'permissions'];
    const options = { fields: fields, lean: true };

    // Create the org
    const createdOrgs = await OrgController.create(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const foundOrg = createdOrgs[0];

    const keys = Object.keys(foundOrg);
    // +1 because the _id field is always returned no matter what
    chai.expect(keys.length).to.equal(fields.length + 1);
    // Check that only the specified fields have been returned
    fields.forEach((field) => {
      chai.expect(keys.includes(field)).to.equal(true);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the create results return JSON data rather than model instances
 */
async function optionLeanCreate() {
  try {
    // Select a org to test
    const orgID = utils.parseID(orgs[1]._id).pop();
    const orgObj = {
      id: orgID,
      name: 'Org01'
    };

    // Delete the org
    await OrgController.remove(adminUser, orgID);

    // Create lean option
    const options = { lean: true };

    // Create the org
    const createdOrgs = await OrgController.create(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const foundOrg = createdOrgs[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof foundOrg.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the return object from update() can be populated
 */
async function optionPopulateUpdate() {
  try {
    // Select a org to test
    const orgID = utils.parseID(orgs[1]._id).pop();
    const orgObj = {
      id: orgID,
      name: 'Org01 populate update'
    };

    // Get populate options, without archivedBy because this org isn't archived
    let fields = Organization.getValidPopulateFields();
    fields = fields.filter((f) => f !== 'archivedBy');
    const options = { populate: fields };

    // Update the org
    const updatedOrgs = await OrgController.update(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(updatedOrgs.length).to.equal(1);
    const createdOrg = updatedOrgs[0];

    // Check that each populated field was returned as an object
    fields.forEach((field) => {
      chai.expect(typeof createdOrg[field] === 'object').to.equal(true);
      chai.expect(createdOrg[field]).to.not.equal(null);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the update results only return specified fields
 */
async function optionFieldsUpdate() {
  try {
    // Select a org to test
    const orgID = utils.parseID(orgs[1]._id).pop();
    const orgObj = {
      id: orgID,
      name: 'Org01 fields update'
    };

    // Create fields option
    const fields = ['name', 'permissions'];
    const options = { fields: fields, lean: true };

    // Update the org
    const updatedOrgs = await OrgController.update(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(updatedOrgs.length).to.equal(1);
    const foundOrg = updatedOrgs[0];

    const keys = Object.keys(foundOrg);
    // +1 because the _id field is always returned no matter what
    chai.expect(keys.length).to.equal(fields.length + 1);
    // Check that only the specified fields have been returned
    fields.forEach((field) => {
      chai.expect(keys.includes(field)).to.equal(true);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the update results return JSON data rather than model instances
 */
async function optionLeanUpdate() {
  try {
    // Select a org to test
    const orgID = utils.parseID(orgs[1]._id).pop();
    const orgObj = {
      id: orgID,
      name: 'Org01 lean update'
    };

    // Create lean option
    const options = { lean: true };

    // Update the org
    const createdOrgs = await OrgController.update(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const foundOrg = createdOrgs[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof foundOrg.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the return object from create() can be populated
 */
async function optionPopulateReplace() {
  try {
    // Select a org to test
    const orgID = orgs[1]._id;
    const orgObj = {
      id: orgID,
      name: 'Org01'
    };

    // Get populate options, without archivedBy because this org isn't archived
    let fields = Organization.getValidPopulateFields();
    fields = fields.filter((f) => f !== 'archivedBy');
    const options = { populate: fields };

    // Replace the org
    const createdOrgs = await OrgController.createOrReplace(adminUser, orgObj,
      options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const createdOrg = createdOrgs[0];

    // Check that each populated field was returned as an object
    fields.forEach((field) => {
      chai.expect(typeof createdOrg[field] === 'object').to.equal(true);
      chai.expect(createdOrg[field]).to.not.equal(null);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the create results only return specified fields
 */
async function optionFieldsReplace() {
  try {
    // Select a org to test
    const orgID = orgs[1]._id;
    const orgObj = {
      id: orgID,
      name: 'Org01'
    };

    // Create fields option
    const fields = ['name', 'permissions'];
    const options = { fields: fields, lean: true };

    // Replace the org
    const createdOrgs = await OrgController.createOrReplace(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const foundOrg = createdOrgs[0];

    const keys = Object.keys(foundOrg);
    // +1 because the _id field is always returned no matter what
    chai.expect(keys.length).to.equal(fields.length + 1);
    // Check that only the specified fields have been returned
    fields.forEach((field) => {
      chai.expect(keys.includes(field)).to.equal(true);
    });
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the create results return JSON data rather than model instances
 */
async function optionLeanReplace() {
  try {
    // Select a org to test
    const orgID = orgs[1]._id;
    const orgObj = {
      id: orgID,
      name: 'Org01'
    };

    // Create lean option
    const options = { lean: true };

    // Replace the org
    const createdOrgs = await OrgController.createOrReplace(adminUser,
      orgObj, options);
    // There should be one org
    chai.expect(createdOrgs.length).to.equal(1);
    const foundOrg = createdOrgs[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof foundOrg.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}
