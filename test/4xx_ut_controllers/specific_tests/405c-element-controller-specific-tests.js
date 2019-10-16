/**
 * @classification UNCLASSIFIED
 *
 * @module test.405c-element-controller-specific-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Austin Bieber
 * @author Connor Doyle
 *
 * @description These tests test for specific use cases within the element
 * controller. The tests verify that operations can be done that are more
 * specific than the core tests.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const ElementController = M.require('controllers.element-controller');
const ProjectController = M.require('controllers.project-controller');
const Element = M.require('models.element');
const db = M.require('lib.db');
const jmi = M.require('lib.jmi-conversions');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
let adminUser = null;
let org = null;
const projIDs = [];
let branchID = null;
let elements = [];

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * After: Connect to database. Create an admin user, organization, project,
   * and elements.
   */
  before(async () => {
    try {
      // Open the database connection
      await db.connect();
      // Create test admin
      adminUser = await testUtils.createTestAdmin();

      // Create organization
      org = await testUtils.createTestOrg(adminUser);

      // Create project
      const retProj = await testUtils.createTestProject(adminUser, org.id);
      branchID = testData.branches[0].id;

      // Add project to array of created projects
      projIDs.push(utils.parseID(retProj.id).pop());

      // Create an additional project with visibility of internal to be used
      // for testing the ability to reference elements on another project
      const internalProject = testData.projects[1];
      internalProject.visibility = 'internal';

      const intProj = await ProjectController.create(adminUser, org.id, internalProject);

      // Add project to array of created projects
      projIDs.push(utils.parseID(intProj[0].id).pop());

      // Create test elements for the main project
      const elems = testData.elements;
      elements = await ElementController.create(adminUser, org.id, projIDs[0], branchID, elems);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Remove organization, project and elements.
   * Close database connection.
   */
  after(async () => {
    try {
      // Remove organization
      // Note: Projects and elements under organization will also be removed
      await testUtils.removeTestOrg(adminUser);
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
  it('should populate allowed fields when finding an element', optionPopulateFind);
  it('should find an archived element when the option archived is provided', optionArchivedFind);
  it('should find an element and its subtree when the option subtree '
    + 'is provided', optionSubtreeFind);
  it('should return an element with only the specific fields specified from'
    + ' find()', optionFieldsFind);
  it('should return a limited number of elements from find()', optionLimitFind);
  it('should return a second batch of elements with the limit and skip option'
    + ' from find()', optionSkipFind);
  it('should return a raw JSON version of an element instead of a document with'
    + ' instance methods from find()', optionLeanFind);
  it('should sort find results', optionSortFind);
  it('should return every parent up to root with the rootpath option', optionRootpathFind);
  // ------------- Create -------------
  it('should create an archived element', createArchivedElement);
  it('should create an element whose source is on a different project', createExternalSource);
  it('should create an element whose target is on a different project', createExternalTarget);
  it('should populate allowed fields when creating an element', optionPopulateCreate);
  it('should return an element with only the specific fields specified from'
    + ' create()', optionFieldsCreate);
  it('should return a raw JSON version of an element instead of a document with'
    + ' instance methods from create()', optionLeanCreate);
  // ------------- Update -------------
  it('should archive an element', archiveElement);
  it('should update an element source to be on a different project', updateExternalSource);
  it('should update an element target to be on a different project', updateExternalTarget);
  it('should populate allowed fields when updating an element', optionPopulateUpdate);
  it('should return an element with only the specific fields specified from'
    + ' update()', optionFieldsUpdate);
  it('should return a raw JSON version of an element instead of a document with'
    + ' instance methods from update()', optionLeanUpdate);
  // ------------- Replace ------------
  it('should populate allowed fields when replacing an element', optionPopulateReplace);
  it('should return an element with only the specific fields specified from'
    + ' createOrReplace()', optionFieldsReplace);
  it('should return a raw JSON version of an element instead of a document with'
    + ' instance methods from createOrReplace()', optionLeanReplace);
  // ------------- Remove -------------
  it('should delete an element which is part of a relationship', deleteRelElement);
  // ------------- Search -------------
  it('should populate allowed fields when searching an element', optionPopulateSearch);
  it('should search an archived element when the option archived is provided',
    optionArchivedSearch);
  it('should return a limited number of elements from search()', optionLimitSearch);
  it('should return a second batch of elements with the limit and skip option '
    + 'from search()', optionSkipSearch);
  it('should return a raw JSON version of an element instead of a document with'
    + ' instance methods from search()', optionLeanSearch);
  it('should sort find results', optionSortFind);
  it('should return a raw JSON version of an element instead of a document with'
    + ' instance methods from search()', optionLeanSearch);
  it('should sort search results', optionSortSearch);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that an element can be archived upon creation.
 */
async function createArchivedElement() {
  try {
    // Create the element object
    const elemObj = {
      id: 'archived-element',
      name: 'Archived Element',
      archived: true
    };

    // Create the element
    const createdElements = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, elemObj);
    // Verify that only one element was created
    chai.expect(createdElements.length).to.equal(1);
    const elem = createdElements[0];

    // Expect archived to be true, and archivedOn and archivedBy to not be null
    chai.expect(elem.archived).to.equal(true);
    chai.expect(elem.archivedBy).to.equal(adminUser._id);
    chai.expect(elem.archivedOn).to.not.equal(null);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that an element can be archived.
 */
async function archiveElement() {
  try {
    // Get the ID of the element to archive
    const elemID = utils.parseID(elements[6]._id).pop();
    // Create the update object
    const updateObj = {
      id: elemID,
      archived: true
    };

    // Update the element with archived: true
    const updatedElements = await ElementController.update(adminUser, org.id, projIDs[0],
      branchID, updateObj);

    // Verify the array length is exactly 1
    chai.expect(updatedElements.length).to.equal(1);
    const elem = updatedElements[0];

    // Expect archived to be true, and archivedOn and archivedBy to not be null
    chai.expect(elem.archived).to.equal(true);
    chai.expect(elem.archivedBy).to.equal(adminUser._id);
    chai.expect(elem.archivedOn).to.not.equal(null);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that an element can be created with a source that is
 * in a referenced project.
 */
async function createExternalSource() {
  try {
  // Create element with sourceNamespace that points to referenced project
    const newElement = {
      id: 'external-source',
      source: 'model',
      sourceNamespace: {
        org: org.id,
        project: projIDs[1],
        branch: branchID
      },
      target: 'model'
    };

    // Create the element using the element controller
    const createdElements = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, newElement);
    const elem = createdElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], branchID, 'model');
    // Verify the source is equal to the referencedID
    chai.expect(elem.source).to.equal(referencedID);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that an element can be created with a target that is
 * in a referenced project.
 */
async function createExternalTarget() {
  try {
    // Create element with targetNamespace that points to referenced project
    const newElement = {
      id: 'external-target',
      source: 'model',
      target: 'model',
      targetNamespace: {
        org: org.id,
        project: projIDs[1],
        branch: branchID
      }
    };

    // Create the element using the element controller
    const createdElements = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, newElement);
    const elem = createdElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], branchID, 'model');
    // Verify the target is equal to the referencedID
    chai.expect(elem.target).to.equal(referencedID);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that an element can be updated with a source that is in
 * a referenced project.
 */
async function updateExternalSource() {
  try {
    // Create the update object which contains a sourceNamespace
    const updateObj = {
      id: 'external-source',
      source: 'undefined',
      sourceNamespace: {
        org: org.id,
        project: projIDs[1],
        branch: branchID
      }
    };

    // Update the element using the element controller
    const updatedElements = await ElementController.update(adminUser, org.id, projIDs[0],
      branchID, updateObj);
    const elem = updatedElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], branchID, 'undefined');
    // Verify the source is equal to the referencedID
    chai.expect(elem.source).to.equal(referencedID);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that an element can be updated with a target that is in
 * a referenced project.
 */
async function updateExternalTarget() {
  try {
    // Create the update object which contains a targetNamespace
    const updateObj = {
      id: 'external-target',
      target: 'undefined',
      targetNamespace: {
        org: org.id,
        project: projIDs[1],
        branch: branchID
      }
    };

    // Update the element using the element controller
    const updatedElements = await ElementController.update(adminUser, org.id, projIDs[0],
      branchID, updateObj);
    const elem = updatedElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], branchID, 'undefined');
    // Verify the target is equal to the referencedID
    chai.expect(elem.target).to.equal(referencedID);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that when an element is part of a relationship and gets
 * deleted, the relationship gets updated and is pointed to the 'undefined'
 * element.
 */
async function deleteRelElement() {
  try {
    // Grab element ids from relationship
    const rel = utils.parseID(elements[7]._id).pop();
    // Grab deleted element id
    const delElem = utils.parseID(elements[8]._id).pop();

    // Remove element
    await ElementController.remove(adminUser, org.id, projIDs[0], branchID, delElem);
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, rel);
    // Verify relationship updated
    const relationship = foundElements[0];
    chai.expect(relationship.source).to.equal(utils.createID(relationship.branch, 'undefined'));
    chai.expect(relationship.target).to.equal(utils.createID(relationship.branch, 'undefined'));
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that the fields specified in the element model function
 * getValidPopulateFields() can all be populated in the find() function using
 * the option 'populate'.
 */
async function optionPopulateFind() {
  // Get the valid populate fields
  const pop = Element.getValidPopulateFields();
  // Create the options object
  const options = { populate: pop };
  // Get the element ID of a relationship element
  const elemID = utils.parseID(elements[5]._id).pop();

  try {
    // Find a relationship element so source and target can be populated
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, elemID, options);

    // Verify the array length is exactly 1
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // For each field in pop
    pop.forEach((field) => {
      // If the field is defined in the returned element
      if (elem.hasOwnProperty(field)) {
        // Expect each populated field to be an object
        chai.expect(typeof elem.field).to.equal('object');
        // Expect each populated field to at least have an _id
        chai.expect(elem.field.hasOwnProperty('_id')).to.equal(true);
      }
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that archived elements can be found in the find()
 * function using the option 'archived'.
 */
async function optionArchivedFind() {
  try {
    const elemID = utils.parseID(elements[9]._id).pop();

    // Create the options object
    const options = { archived: true };

    // Attempt to find the element without providing options
    const notFoundElements = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      elemID);
    // Expect the array to be empty since the option archived: true was not provided
    chai.expect(notFoundElements.length).to.equal(0);

    // Attempt the find the element WITH providing the archived option
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      elemID, options);

    // Expect the array to be of length 1
    chai.expect(foundElements.length).to.equal(1);
    const element = foundElements[0];

    // Verify all of the archived fields are properly set
    chai.expect(element.archived).to.equal(true);
    chai.expect(element.archivedOn).to.not.equal(null);
    chai.expect(element.archivedBy).to.equal(adminUser._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that an element and its subtree are returned when
 * using the option 'subtree' in find().
 */
async function optionSubtreeFind() {
  try {
    // Set up
    const elemID = utils.parseID(elements[2]._id).pop();

    // Create the options object. Search for includeArchived:true since one child element
    // was archived in a previous test
    const options = { subtree: true, includeArchived: true, lean: true };

    // Find the element and its subtree
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      elemID, options);

    // Expect there to be 6 elements found, the searched element and 5 in subtree
    chai.expect(foundElements.length).to.equal(6);

    // Attempt to convert elements to JMI3, if successful then it's a valid tree
    const jmi3Elements = jmi.convertJMI(1, 3, foundElements, '_id', '_id');

    // Verify that there is only one top level key in jmi3, which should be the
    // searched element
    chai.expect(Object.keys(jmi3Elements).length).to.equal(1);
    chai.expect(Object.keys(jmi3Elements)[0]).to.equal(elements[2]._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that option 'fields' returns an element with only
 * specific fields in find().
 */
async function optionFieldsFind() {
  try {
    // TODO: In the future, add a corner-case test to test for the fields option being supplied
    // TODO: but not value being supplied.
    // Get the ID of the element to find
    const elemID = utils.parseID(elements[0]._id);
    // Create the options object with the list of fields specifically find
    const findOptions = { fields: ['name', 'createdBy'] };
    // Create the options object with the list of fields to specifically NOT find
    const notFindOptions = { fields: ['-createdOn', '-updatedOn'] };
    // Create the list of fields which are always provided no matter what
    const fieldsAlwaysProvided = ['_id'];

    // Find the element only with specific fields.
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, elemID, findOptions);
    // Expect there to be exactly 1 element found
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // Create the list of fields that should be returned
    const expectedFields = findOptions.fields.concat(fieldsAlwaysProvided);

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields = Object.keys(elem._doc);

    // Check that the only keys in the element are the expected ones
    chai.expect(visibleFields).to.have.members(expectedFields);

    // Find the element without the notFind fields
    const notFindElements = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, elemID, notFindOptions);
    // Expect there to be exactly 1 element found
    chai.expect(notFindElements.length).to.equal(1);
    const elem2 = foundElements[0];

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields2 = Object.keys(elem2._doc);

    // Check that the keys in the notFindOptions are not in elem
    chai.expect(Object.keys(visibleFields2)).to.not.have.members(['createdOn', 'updatedOn']);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies a limited number of elements are returned when the
 * option 'limit' is supplied to the find() function.
 */
async function optionLimitFind() {
  try {
    // Create the options object with a limit of 2
    const options = { limit: 2 };

    // Find all elements on a given project
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, options);
    // Verify that no more than 2 elements were found
    chai.expect(foundElements).to.have.lengthOf.at.most(2);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that a second batch of elements are returned when using
 * the 'skip' and 'limit' option together in the find() function.
 */
async function optionSkipFind() {
  try {
    // Create an array to store first batch of element ids
    let firstBatchIDs = [];
    // Create the first options object with just a limit
    const firstOptions = { limit: 2 };
    // Create the second options object with a limit and skip
    const secondOptions = { limit: 2, skip: 2 };

    // Find all elements on a given project
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, firstOptions);
    // Verify that no more than 2 elements were found
    chai.expect(foundElements).to.have.lengthOf.at.most(2);
    // Add element ids to the firstBatchIDs array
    firstBatchIDs = foundElements.map(e => e._id);

    // Find the next batch of elements
    const secondElements = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      secondOptions);
    // Verify that no more than 2 elements were found
    chai.expect(secondElements).to.have.lengthOf.at.most(2);
    // Verify the second batch of elements are not the same as the first
    const secondBatchIDs = secondElements.map(e => e._id);
    chai.expect(secondBatchIDs).to.not.have.members(firstBatchIDs);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that providing the option 'lean' returns raw JSON of an
 * element rather than a document with instance methods in the find() function.
 */
async function optionLeanFind() {
  try {
    // Get the ID of the element to find
    const elemID = utils.parseID(elements[0]._id).pop();
    // Create the options object with lean: true
    const options = { lean: true };

    // Find the element without the lean option
    const notLeanELems = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, elemID);
    // Expect there to be exactly 1 element found
    chai.expect(notLeanELems.length).to.equal(1);
    const elem = notLeanELems[0];

    // Expect the instance method getValidUpdateFields to be a function
    chai.expect(typeof elem.getValidUpdateFields).to.equal('function');

    // Find the element WITH the lean option
    const leanElems = await ElementController.find(adminUser, org.id, projIDs[0],
      branchID, elemID, options);
    // Expect there to be exactly 1 element found
    chai.expect(leanElems.length).to.equal(1);
    const elem2 = leanElems[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof elem2.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that the fields specified in the element model function
 * getValidPopulateFields() can all be populated in the create() function using
 * the option 'populate'.
 */
async function optionPopulateCreate() {
  try {
    // Get the valid populate fields
    const pop = Element.getValidPopulateFields();
    // Create the options object
    const options = { populate: pop };
    // Create the element object
    const elemObj = {
      id: 'populate-element',
      source: utils.parseID(elements[0]._id).pop(),
      target: utils.parseID(elements[1]._id).pop()
    };

    // Create the element
    const createdElements = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, elemObj, options);
    // Verify the array length is exactly 1
    chai.expect(createdElements.length).to.equal(1);
    const elem = createdElements[0];

    // For each field in pop
    pop.forEach((field) => {
      // If the field is defined in the returned element
      if (elem.hasOwnProperty(field)) {
        // Expect each populated field to be an object
        chai.expect(typeof elem.field).to.equal('object');
        // Expect each populated field to at least have an _id
        chai.expect(elem.field.hasOwnProperty('_id')).to.equal(true);
      }
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that option 'fields' returns an element with only
 * specific fields in create().
 */
async function optionFieldsCreate() {
  try {
    // Create the element objects
    const elemObjFind = {
      id: 'fields-element',
      name: 'Fields Element'
    };
    const elemObjNotFind = {
      id: 'not-fields-element',
      name: 'Not Fields Element'
    };
    // Create the options object with the list of fields specifically find
    const findOptions = { fields: ['name', 'createdBy'] };
    // Create the options object with the list of fields to specifically NOT find
    const notFindOptions = { fields: ['-createdOn', '-updatedOn'] };
    // Create the list of fields which are always provided no matter what
    const fieldsAlwaysProvided = ['_id'];

    // Create the element only with specific fields returned
    const createdElements = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, elemObjFind, findOptions);
    // Expect there to be exactly 1 element created
    chai.expect(createdElements.length).to.equal(1);
    const elem = createdElements[0];

    // Create the list of fields that should be returned
    const expectedFields = findOptions.fields.concat(fieldsAlwaysProvided);

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields = Object.keys(elem._doc);

    // Check that the only keys in the element are the expected ones
    chai.expect(visibleFields).to.have.members(expectedFields);

    // Create the element without the notFind fields
    const notFindElements = await ElementController.create(adminUser, org.id, projIDs[0], branchID,
      elemObjNotFind, notFindOptions);
    // Expect there to be exactly 1 element created
    chai.expect(notFindElements.length).to.equal(1);
    const elem2 = notFindElements[0];

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields2 = Object.keys(elem2._doc);

    // Check that the keys in the notFindOptions are not in elem
    chai.expect(Object.keys(visibleFields2)).to.not.have.members(['createdOn', 'updatedOn']);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that providing the option 'lean' returns raw JSON of an
 * element rather than a document with instance methods object in the create()
 * function.
 */
async function optionLeanCreate() {
  // Create the element object
  const leanElemObj = {
    id: 'lean-element',
    name: 'Lean Element'
  };
  const notLeanElemObj = {
    id: 'not-lean-element',
    name: 'Not Lean Element'
  };
  // Create the options object with lean: true
  const options = { lean: true };

  try {
    // Create the element without the lean option
    const createdElements = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, notLeanElemObj);
    // Expect there to be exactly 1 element created
    chai.expect(createdElements.length).to.equal(1);
    const elem = createdElements[0];

    // Expect the instance method getValidUpdateFields to be a function
    chai.expect(typeof elem.getValidUpdateFields).to.equal('function');

    // Create the element WITH the lean option
    const createdElements2 = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, leanElemObj, options);
    // Expect there to be exactly 1 element created
    chai.expect(createdElements2.length).to.equal(1);
    const elem2 = createdElements2[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof elem2.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that the fields specified in the element model function
 * getValidPopulateFields() can all be populated in the update() function using
 * the option 'populate'.
 */
async function optionPopulateUpdate() {
  try {
    // Get the valid populate fields
    const pop = Element.getValidPopulateFields();
    // Create the options object
    const options = { populate: pop };
    // Create the update object
    const updateObj = {
      id: 'populate-element',
      name: 'Update Element'
    };

    // Update the element
    const updatedElements = await ElementController.update(adminUser, org.id, projIDs[0],
      branchID, updateObj, options);
    // Verify the array length is exactly 1
    chai.expect(updatedElements.length).to.equal(1);
    const elem = updatedElements[0];

    // For each field in pop
    pop.forEach((field) => {
      // If the field is defined in the returned element
      if (elem.hasOwnProperty(field)) {
        // Expect each populated field to be an object
        chai.expect(typeof elem.field).to.equal('object');
        // Expect each populated field to at least have an _id
        chai.expect(elem.field.hasOwnProperty('_id')).to.equal(true);
      }
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that option 'fields' returns an element with only
 * specific fields in update().
 */
async function optionFieldsUpdate() {
  try {
    // Create the update objects
    const updateObjFind = {
      id: 'fields-element',
      name: 'Fields Element Updated'
    };
    const updateObjNotFind = {
      id: 'not-fields-element',
      name: 'Not Fields Element Updated'
    };
    // Create the options object with the list of fields specifically find
    const findOptions = { fields: ['name', 'createdBy'] };
    // Create the options object with the list of fields to specifically NOT find
    const notFindOptions = { fields: ['-createdOn', '-updatedOn'] };
    // Create the list of fields which are always provided no matter what
    const fieldsAlwaysProvided = ['_id'];

    // Update the element only with specific fields returned
    const updatedElements = await ElementController.update(adminUser, org.id, projIDs[0],
      branchID, updateObjFind, findOptions);
    // Expect there to be exactly 1 element updated
    chai.expect(updatedElements.length).to.equal(1);
    const elem = updatedElements[0];

    // Create the list of fields that should be returned
    const expectedFields = findOptions.fields.concat(fieldsAlwaysProvided);

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields = Object.keys(elem._doc);

    // Check that the only keys in the element are the expected ones
    chai.expect(visibleFields).to.have.members(expectedFields);

    // Update the element without the notFind fields
    const notFindElements = await ElementController.update(adminUser, org.id, projIDs[0], branchID,
      updateObjNotFind, notFindOptions);
    // Expect there to be exactly 1 element updated
    chai.expect(notFindElements.length).to.equal(1);
    const elem2 = notFindElements[0];

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields2 = Object.keys(elem2._doc);

    // Check that the keys in the notFindOptions are not in elem
    chai.expect(Object.keys(visibleFields2)).to.not.have.members(['createdOn', 'updatedOn']);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that providing the option 'lean' returns raw JSON of an
 * element rather than a document with instance methods object in the update()
 * function.
 */
async function optionLeanUpdate() {
  try {
    // Create the update object
    const elem0 = {
      id: utils.parseID(elements[0].id).pop(),
      name: 'update 1'
    };

    // Create the options object with lean: true
    const options = { lean: true };
    // Update the element without the lean option
    const updatedElements = await ElementController.update(adminUser, org.id, projIDs[0], branchID,
      elem0);

    // Expect there to be exactly 1 element updated
    chai.expect(updatedElements.length).to.equal(1);
    const elem1 = updatedElements[0];
    chai.expect(elem1.name).to.equal('update 1');

    // Expect the instance method getValidUpdateFields to be a function
    chai.expect(typeof elem1.getValidUpdateFields).to.equal('function');

    // Make a second update
    elem0.name = 'Batch Element 0';

    // Update the element WITH the lean option
    const leanUpdatedElements = await ElementController.update(adminUser, org.id, projIDs[0],
      branchID, elem0, options);

    // Expect there to be exactly 1 element updated
    chai.expect(leanUpdatedElements.length).to.equal(1);
    const elem2 = leanUpdatedElements[0];
    chai.expect(elem2.name).to.equal('Batch Element 0');


    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof elem2.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that the fields specified in the element model function
 * getValidPopulateFields() can all be populated in the createOrReplace()
 * function using the option 'populate'.
 */
async function optionPopulateReplace() {
  try {
    // Get the valid populate fields
    const pop = Element.getValidPopulateFields();
    // Create the options object
    const options = { populate: pop };
    // Create the element object
    const elemObj = {
      id: 'populate-element',
      source: utils.parseID(elements[0]._id).pop(),
      target: utils.parseID(elements[1]._id).pop()
    };

    // Replace the element
    const replacedElems = await ElementController.createOrReplace(adminUser, org.id, projIDs[0],
      branchID, elemObj, options);
    // Verify the array length is exactly 1
    chai.expect(replacedElems.length).to.equal(1);
    const elem = replacedElems[0];

    // For each field in pop
    pop.forEach((field) => {
      // If the field is defined in the returned element
      if (elem.hasOwnProperty(field)) {
        // Expect each populated field to be an object
        chai.expect(typeof elem.field).to.equal('object');
        // Expect each populated field to at least have an _id
        chai.expect(elem.field.hasOwnProperty('_id')).to.equal(true);
      }
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that option 'fields' returns an element with only
 * specific fields in createOrReplace().
 */
async function optionFieldsReplace() {
  try {
    // Create the element objects
    const elemObjFind = {
      id: 'fields-element',
      name: 'Fields Element'
    };
    const elemObjNotFind = {
      id: 'not-fields-element',
      name: 'Not Fields Element'
    };
    // Create the options object with the list of fields specifically find
    const findOptions = { fields: ['name', 'createdBy'] };
    // Create the options object with the list of fields to specifically NOT find
    const notFindOptions = { fields: ['-createdOn', '-updatedOn'] };
    // Create the list of fields which are always provided no matter what
    const fieldsAlwaysProvided = ['_id'];

    // Replace the element only with specific fields returned
    const fieldsElems = await ElementController.createOrReplace(adminUser, org.id, projIDs[0],
      branchID, elemObjFind, findOptions);
    // Expect there to be exactly 1 element replaced
    chai.expect(fieldsElems.length).to.equal(1);
    const elem = fieldsElems[0];

    // Create the list of fields that should be returned
    const expectedFields = findOptions.fields.concat(fieldsAlwaysProvided);

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields = Object.keys(elem._doc);

    // Check that the only keys in the element are the expected ones
    chai.expect(visibleFields).to.have.members(expectedFields);

    // Replace the element without the notFind fields
    const notFieldsElems = await ElementController.createOrReplace(adminUser, org.id, projIDs[0],
      branchID, elemObjNotFind, notFindOptions);
    // Expect there to be exactly 1 element replaced
    chai.expect(notFieldsElems.length).to.equal(1);
    const elem2 = notFieldsElems[0];

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields2 = Object.keys(elem2._doc);

    // Check that the keys in the notFindOptions are not in elem
    chai.expect(Object.keys(visibleFields2)).to.not.have.members(['createdOn', 'updatedOn']);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that providing the option 'lean' returns raw JSON of an
 * element rather than a document with instance methods object in the
 * createOrReplace() function.
 */
async function optionLeanReplace() {
  try {
    // Create the element object
    const leanElemObj = {
      id: 'lean-element',
      name: 'Lean Element'
    };
    const notLeanElemObj = {
      id: 'not-lean-element',
      name: 'Not Lean Element'
    };
    // Create the options object with lean: true
    const options = { lean: true };

    // Replace the element without the lean option
    const leanElems = await ElementController.createOrReplace(adminUser, org.id, projIDs[0],
      branchID, notLeanElemObj);
    // Expect there to be exactly 1 element replaced
    chai.expect(leanElems.length).to.equal(1);
    const elem = leanElems[0];

    // Expect the instance method getValidUpdateFields to be a function
    chai.expect(typeof elem.getValidUpdateFields).to.equal('function');

    // Replace the element WITH the lean option
    const notLeanElems = await ElementController.createOrReplace(adminUser, org.id, projIDs[0],
      branchID, leanElemObj, options);
    // Expect there to be exactly 1 element replaced
    chai.expect(notLeanElems.length).to.equal(1);
    const elem2 = notLeanElems[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof elem2.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that the fields specified in the element model function
 * getValidPopulateFields() can all be populated in the search() function using
 * the option 'populate'.
 */
async function optionPopulateSearch() {
  try {
    // Get the valid populate fields
    const pop = Element.getValidPopulateFields();
    // Create the options object
    const options = { populate: pop };
    // Create the text string to search for
    const query = '"Element #1"';

    // Search for elements
    const foundElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query, options);
    // Verify the array length is exactly 1
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // For each field in pop
    pop.forEach((field) => {
      // If the field is defined in the returned element
      if (elem.hasOwnProperty(field)) {
        // Expect each populated field to be an object
        chai.expect(typeof elem.field).to.equal('object');
        // Expect each populated field to at least have an _id
        chai.expect(elem.field.hasOwnProperty('_id')).to.equal(true);
      }
    });
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that archived elements can be found in the search()
 * function using the option 'archived'.
 */
async function optionArchivedSearch() {
  try {
    // Create the options object
    const options = { archived: true };
    // Create the text string to search for
    const query = `"${elements[6].name}"`;

    // Search for the element, expecting no results back
    const notFoundElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query);
    // Expect the array to be empty since the option archived: true was not provided
    chai.expect(notFoundElements.length).to.equal(0);

    // Attempt the find the element WITH providing the archived option
    const foundElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query, options);
    // Expect the array to be of length 1
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // Verify all of the archived fields are properly set
    chai.expect(elem.archived).to.equal(true);
    chai.expect(elem.archivedOn).to.not.equal(null);
    chai.expect(elem.archivedBy).to.equal(adminUser._id);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies a limited number of elements are returned when the
 * option 'limit' is supplied to the search() function.
 */
async function optionLimitSearch() {
  try {
    // Create the options object with a limit of 2
    const options = { limit: 2 };
    // Create the text string to search for, should find more than 2 elements
    const query = 'model';

    // Search for elements
    const foundElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query, options);
    // Verify that no more than 2 elements were found
    chai.expect(foundElements).to.have.lengthOf.at.most(2);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that a second batch of elements are returned when using
 * the 'skip' and 'limit' option together in the search() function.
 */
async function optionSkipSearch() {
  try {
    // Create an array to store first batch of element ids
    let firstBatchIDs = [];
    // Create the first options object with just a limit
    const firstOptions = { limit: 2 };
    // Create the second options object with a limit and skip
    const secondOptions = { limit: 2, skip: 2 };
    // Create the query
    const query = 'model';

    // Search for elements
    const firstElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query, firstOptions);
    // Verify that no more than 2 elements were found
    chai.expect(firstElements).to.have.lengthOf.at.most(2);
    // Add element ids to the firstBatchIDs array
    firstBatchIDs = firstElements.map(e => e._id);

    // Search for next batch of elements
    const secondElements = await ElementController.search(adminUser, org.id, projIDs[0], branchID,
      query, secondOptions);
    // Verify that no more than 2 elements were found
    chai.expect(secondElements).to.have.lengthOf.at.most(2);
    // Verify the second batch of elements are not the same as the first
    const secondBatchIDs = secondElements.map(e => e._id);
    chai.expect(secondBatchIDs).to.not.have.members(firstBatchIDs);
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Verifies that providing the option 'lean' returns raw JSON of an
 * element rather than a document with instance methods object in the search()
 * function.
 */
async function optionLeanSearch() {
  try {
    // Create the query to search with
    const query = `"${elements[0].name}"`;
    // Create the options object with lean: true
    const options = { lean: true };

    // Search for elements
    const foundElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query);
    // Expect there to be exactly 1 element found
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // Expect the instance method getValidUpdateFields to be a function
    chai.expect(typeof elem.getValidUpdateFields).to.equal('function');

    // Search for elements WITH the lean option
    const leanElements = await ElementController.search(adminUser, org.id, projIDs[0],
      branchID, query, options);
    // Expect there to be exactly 1 element found
    chai.expect(leanElements.length).to.equal(1);
    const elem2 = leanElements[0];

    // Expect the instance method getValidUpdateFields to be undefined
    chai.expect(typeof elem2.getValidUpdateFields).to.equal('undefined');
  }
  catch (error) {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the find results can be sorted.
 */
async function optionSortFind() {
  try {
    // Create element objects
    const testElems = [{
      id: 'testelem00',
      name: 'b'
    },
    {
      id: 'testelem01',
      name: 'c'
    },
    {
      id: 'testelem02',
      name: 'a'
    }];
    // Create sort options
    const sortOption = { sort: 'name' };
    const sortOptionReverse = { sort: '-name' };

    // Create the test elements
    const createdElems = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, testElems);
    // Validate that 3 elements were created
    chai.expect(createdElems.length).to.equal(3);

    // Find the elements and return them sorted
    const foundElems = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      testElems.map((e) => e.id),
      sortOption);

    // Expect to find all three elements
    chai.expect(foundElems.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(foundElems[0].name).to.equal('a');
    chai.expect(foundElems[0].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem02'));
    chai.expect(foundElems[1].name).to.equal('b');
    chai.expect(foundElems[1].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem00'));
    chai.expect(foundElems[2].name).to.equal('c');
    chai.expect(foundElems[2].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem01'));

    // Find the elements and return them sorted in reverse
    const reverseElems = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      testElems.map((e) => e.id),
      sortOptionReverse);
    // Expect to find all three elements
    chai.expect(foundElems.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(reverseElems[0].name).to.equal('c');
    chai.expect(reverseElems[0].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem01'));
    chai.expect(reverseElems[1].name).to.equal('b');
    chai.expect(reverseElems[1].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem00'));
    chai.expect(reverseElems[2].name).to.equal('a');
    chai.expect(reverseElems[2].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem02'));

    await ElementController.remove(adminUser, org.id, projIDs[0], branchID,
      testElems.map((e) => e.id));
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that the search results can be sorted.
 */
async function optionSortSearch() {
  try {
    // Create element objects
    const testElems = [{
      id: 'testelem00',
      name: 'b',
      documentation: 'searchme'
    },
    {
      id: 'testelem01',
      name: 'c',
      documentation: 'searchme'
    },
    {
      id: 'testelem02',
      name: 'a',
      documentation: 'searchme'
    },
    {
      id: 'testelem03',
      name: 'd',
      documentation: 'no'
    }];

    // Create sort options
    const sortOption = { sort: 'name' };
    const sortOptionReverse = { sort: '-name' };
    // Search term
    const searchQuery = 'searchme';

    // Create the test elements
    const createdElems = await ElementController.create(adminUser, org.id, projIDs[0],
      branchID, testElems);
    // Validate that 4 elements were created
    chai.expect(createdElems.length).to.equal(4);

    // Search the elements and return them sorted
    const sortedElems = await ElementController.search(adminUser, org.id, projIDs[0], branchID,
      searchQuery, sortOption);
    // Expect to only find three elements
    chai.expect(sortedElems.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(sortedElems[0].name).to.equal('a');
    chai.expect(sortedElems[0].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem02'));
    chai.expect(sortedElems[1].name).to.equal('b');
    chai.expect(sortedElems[1].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem00'));
    chai.expect(sortedElems[2].name).to.equal('c');
    chai.expect(sortedElems[2].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem01'));

    // Search the elements and return them sorted in reverse
    const reverseElems = await ElementController.search(adminUser, org.id, projIDs[0], branchID,
      searchQuery, sortOptionReverse);
    // Expect to find three elements
    chai.expect(reverseElems.length).to.equal(3);

    // Validate that the sort option is working
    chai.expect(reverseElems[0].name).to.equal('c');
    chai.expect(reverseElems[0].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem01'));
    chai.expect(reverseElems[1].name).to.equal('b');
    chai.expect(reverseElems[1].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem00'));
    chai.expect(reverseElems[2].name).to.equal('a');
    chai.expect(reverseElems[2].id).to.equal(utils.createID(org.id, projIDs[0], branchID, 'testelem02'));

    await ElementController.remove(adminUser, org.id, projIDs[0], branchID,
      testElems.map((e) => e.id));
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}

/**
 * @description Validates that findElement function can return every parent up to root.
 */
async function optionRootpathFind() {
  try {
    const elemID = utils.parseID(elements[4]._id).pop();

    const option = { rootpath: true };

    // Return a search on the furthest nested element with the rootpath option
    const foundElements = await ElementController.find(adminUser, org.id, projIDs[0], branchID,
      elemID, option);

    // Expect to find 3 elements
    chai.expect(foundElements.length).to.equal(4);

    const foundIDs = foundElements.map(e => e.id);

    // Expect to find the model element and two test elements
    chai.expect(foundIDs).to.include(utils.createID(org.id, projIDs[0], branchID, 'model'));
    chai.expect(foundIDs).to.include(elements[1].id);
    chai.expect(foundIDs).to.include(elements[2].id);
    chai.expect(foundIDs).to.include(elements[4].id);
  }
  catch (error) {
    M.log.error(error.message);
    // Expect no error
    chai.expect(error.message).to.equal(null);
  }
}
