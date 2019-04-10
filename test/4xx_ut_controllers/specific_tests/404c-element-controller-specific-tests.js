/**
 * Classification: UNCLASSIFIED
 *
 * @module test.404c-element-controller-specific-tests
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
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
const projects = [];
const projIDs = [];
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

      // Create project
      return testUtils.createTestProject(adminUser, org.id);
    })
    .then((retProj) => {
      // Add project to array of created projects
      projects.push(retProj);
      projIDs.push(utils.parseID(retProj.id).pop());

      // Create an additional project with visibility of internal to be used
      // for testing the ability to reference elements on another project
      const internalProject = testData.projects[1];
      internalProject.visibility = 'internal';

      return ProjectController.create(adminUser, org.id, internalProject);
    })
    .then((retProj) => {
      // Add project to array of created projects
      projects.push(retProj[0]);
      projIDs.push(utils.parseID(retProj[0].id).pop());

      // Update the project references array in the main project
      return ProjectController.update(adminUser, org.id,
        { id: projIDs[0], projectReferences: [projIDs[1]] });
    })
    .then(() => {
      // Create test elements for the main project
      const elems = testData.elements;
      return ElementController.create(adminUser, org.id, projIDs[0], 'master', elems);
    })
    .then((createdElements) => {
      elements = createdElements;
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
   * After: Remove organization, project and elements.
   * Close database connection.
   */
  after((done) => {
    // Remove organization
    // Note: Projects and elements under organization will also be removed
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

  /* Execute the tests */
  it('should archive an element', archiveElement);
  it('should create an element whose source is on a different project', createExternalSource);
  it('should create an element whose target is on a different project', createExternalTarget);
  it('should update an element source to be on a different project', updateExternalSource);
  it('should update an element target to be on a different project', updateExternalTarget);
  it('should populate allowed fields when finding an element', optionPopulateFind);
  it('should find an archived element when the option archived is provided', optionArchivedFind);
  it('should find an element and it\'s subtree when the option subtree '
    + 'is provided', optionSubtreeFind);
  it('should return an element with only the specific fields specified', optionFieldsFind);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that an element can be archived.
 */
function archiveElement(done) {
  // Get the ID of the element to archive
  const elemID = utils.parseID(elements[6]._id).pop();
  // Create the update object
  const updateObj = {
    id: elemID,
    archived: true
  };

  // Update the element with archived: true
  ElementController.update(adminUser, org.id, projIDs[0], 'master', updateObj)
  .then((updatedElements) => {
    // Verify the array length is exactly 1
    chai.expect(updatedElements.length).to.equal(1);
    const elem = updatedElements[0];

    // Expect archived to be true, and archivedOn and archivedBy to not be null
    chai.expect(elem.archived).to.equal(true);
    chai.expect(elem.archivedBy).to.equal(adminUser.username);
    chai.expect(elem.archivedOn).to.not.equal(null);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that an element can be created with a source that is
 * in a referenced project.
 */
function createExternalSource(done) {
  // Create element with sourceNamespace that points to referenced project
  const newElement = {
    id: 'external-source',
    source: 'model',
    sourceNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    },
    target: 'model'
  };

  // Create the element using the element controller
  ElementController.create(adminUser, org.id, projIDs[0], 'master', newElement)
  .then((createdElements) => {
    const elem = createdElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'model');
    // Verify the source is equal to the referencedID
    chai.expect(elem.source).to.equal(referencedID);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that an element can be created with a target that is
 * in a referenced project.
 */
function createExternalTarget(done) {
  // Create element with targetNamespace that points to referenced project
  const newElement = {
    id: 'external-target',
    source: 'model',
    target: 'model',
    targetNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    }
  };

  // Create the element using the element controller
  ElementController.create(adminUser, org.id, projIDs[0], 'master', newElement)
  .then((createdElements) => {
    const elem = createdElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'model');
    // Verify the target is equal to the referencedID
    chai.expect(elem.target).to.equal(referencedID);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that an element can be updated with a source that is in
 * a referenced project.
 */
function updateExternalSource(done) {
  // Create the update object which contains a sourceNamespace
  const updateObj = {
    id: 'external-source',
    source: 'undefined',
    sourceNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    }
  };

  // Update the element using the element controller
  ElementController.update(adminUser, org.id, projIDs[0], 'master', updateObj)
  .then((updatedElements) => {
    const elem = updatedElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'undefined');
    // Verify the source is equal to the referencedID
    chai.expect(elem.source).to.equal(referencedID);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that an element can be updated with a target that is in
 * a referenced project.
 */
function updateExternalTarget(done) {
  // Create the update object which contains a targetNamespace
  const updateObj = {
    id: 'external-target',
    target: 'undefined',
    targetNamespace: {
      org: org.id,
      project: projIDs[1],
      branch: 'master'
    }
  };

  // Update the element using the element controller
  ElementController.update(adminUser, org.id, projIDs[0], 'master', updateObj)
  .then((updatedElements) => {
    const elem = updatedElements[0];
    // Create the concatenated ID of the referenced element
    const referencedID = utils.createID(org.id, projIDs[1], 'undefined');
    // Verify the target is equal to the referencedID
    chai.expect(elem.target).to.equal(referencedID);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that the fields specified in the element model function
 * getValidPopulateFields() can all be populated in the find() function using
 * the option 'populate'.
 */
function optionPopulateFind(done) {
  // Get the valid populate fields
  const pop = Element.getValidPopulateFields();
  // Create the options object
  const options = { populate: pop };
  // Get the element ID of a relationship element
  const elemID = utils.parseID(elements[5]._id).pop();

  // Find a relationship element so source and target can be populated
  ElementController.find(adminUser, org.id, projIDs[0], 'master', elemID, options)
  .then((foundElements) => {
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
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that archived elements can be found in the find()
 * function using the option 'archived'.
 */
function optionArchivedFind(done) {
  // Create the options object
  const options = { archived: true };
  // Get the element ID of the archived element
  const elemID = utils.parseID(elements[6]._id).pop();

  // Attempt to find the element without providing options
  ElementController.find(adminUser, org.id, projIDs[0], 'master', elemID)
  .then((foundElements) => {
    // Expect the array to be empty since the option archived: true was not provided
    chai.expect(foundElements.length).to.equal(0);

    // Attempt the find the element WITH providing the archived option
    return ElementController.find(adminUser, org.id, projIDs[0], 'master', elemID, options);
  })
  .then((foundElements) => {
    // Expect the array to be of length 1
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // Verify all of the archived fields are properly set
    chai.expect(elem.archived).to.equal(true);
    chai.expect(elem.archivedOn).to.not.equal(null);
    chai.expect(elem.archivedBy).to.equal(adminUser.username);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that an element and it's subtree are returned when
 * using the option 'subtree' in find().
 */
function optionSubtreeFind(done) {
  // Get the ID of the element to find
  const elemID = utils.parseID(elements[2]._id).pop();
  // Create the options object. Search for archived:true since one child element
  // was archived in a previous test
  const options = { subtree: true, archived: true };

  // Find the element and it's subtree
  ElementController.find(adminUser, org.id, projIDs[0], 'master', elemID, options)
  .then((foundElements) => {
    // Expect there to be 4 elements found, the searched element and 3 in subtree
    chai.expect(foundElements.length).to.equal(4);
    // Attempt to convert elements to JMI3, if successful then its a valid tree
    const jmi3Elements = jmi.convertJMI(1, 3, foundElements);
    // Verify that there is only one top level key in jmi3, which should be the
    // searched element
    chai.expect(Object.keys(jmi3Elements).length).to.equal(1);
    chai.expect(Object.keys(jmi3Elements)[0]).to.equal(elements[2]._id);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies that option 'fields' returns an element with only
 * specific fields in find().
 */
function optionFieldsFind(done) {
  // Get the ID of the element to find
  const elemID = utils.parseID(elements[0]._id);
  // Create the options object with the list of fields specifically find
  const findOptions = { fields: ['name', 'createdBy'] };
  // Create the options object with the list of fields to specifically NOT find
  const notFindOptions = { fields: ['-createdOn', '-updatedOn'] };
  // Create the list of fields which are always provided no matter what
  const fieldsAlwaysProvided = ['_id', 'contains'];

  // Find the element only with specific fields.
  ElementController.find(adminUser, org.id, projIDs[0], 'master', elemID, findOptions)
  .then((foundElements) => {
    // Expect there to be exactly 1 element found
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // Create the list of fields that should be returned
    const expectedFields = findOptions.fields.concat(fieldsAlwaysProvided);

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields = Object.keys(elem._doc).concat(Object.keys(elem.$$populatedVirtuals));

    // Check that the only keys in the element are the expected ones
    chai.expect(visibleFields).to.have.members(expectedFields);

    // Find the element without the notFind fields
    return ElementController.find(adminUser, org.id, projIDs[0], 'master', elemID, notFindOptions);
  })
  .then((foundElements) => {
    // Expect there to be exactly 1 element found
    chai.expect(foundElements.length).to.equal(1);
    const elem = foundElements[0];

    // Create a list of visible element fields. Object.keys(elem) returns hidden fields as well
    const visibleFields = Object.keys(elem._doc).concat(Object.keys(elem.$$populatedVirtuals));

    // Check that the keys in the notFindOptions are not in elem
    chai.expect(Object.keys(visibleFields)).to.not.have.members(['createdOn', 'updatedOn']);
    done();
  })
  .catch((error) => {
    M.log.error(error);
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}
