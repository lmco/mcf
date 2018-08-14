/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.205-lib-utils
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This file tests the utility functions.
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const OrgController = M.require('controllers.OrganizationController');
const ProjectController = M.require('controllers.ProjectController');
const UserController = M.require('controllers.UserController');
const User = M.require('models.User');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

// Define global variables
let admin = null;
let nonAdmin = null;
let org = null;
let intProj = null;
let privProj = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Connect to database, Create module level users, projects, orgs
   */
  before((done) => {
    // Connect to the database
    db.connect();

    // Create new admin user
    admin = new User({
      username: 'adminuser',
      password: 'password',
      admin: true
    });

    // Save admin user
    admin.save((saveUserErr) => {
      chai.expect(saveUserErr).to.equal(null);

      // Create new non-admin user
      const nonAdminData = {
        username: 'nonadminuser',
        password: 'password'
      };
      UserController.createUser(admin, nonAdminData)
      .then((user) => {
        nonAdmin = user;

        // Creating global org
        return OrgController.createOrg(admin, { id: 'orgId', name: 'Org Name' });
      })
      .then((retOrg) => {
        org = retOrg;

        // Create internal project
        const intProjData = {
          id: 'intproj',
          name: 'Internal Project',
          org: {
            id: org.id
          },
          visibility: 'internal'
        };
        return ProjectController.createProject(admin, intProjData);
      })
      .then((proj) => {
        intProj = proj;

        // Create private project
        const privProjData = {
          id: 'privproj',
          name: 'Private Project',
          org: {
            id: org.id
          },
          visibility: 'private'
        };
        return ProjectController.createProject(admin, privProjData);
      })
      .then((proj) => {
        privProj = proj;
        done();
      })
      .catch((error) => {
        chai.expect(error).to.equal(null);
        done();
      });
    });
  });

  /**
   * After: Close database connection, deletes module level users, projects, orgs
   */
  after((done) => {
    // Remove org
    OrgController.removeOrg(admin, 'priv', { soft: false })

    // Remove non-admin user
    .then(() => UserController.removeUser(admin, 'nonadminuser'))
    .then(() => {
      // Remove admin user
      User.findOne({
        username: 'adminuser'
      }, (err, foundUser) => {
        chai.expect(err).to.equal(null);
        foundUser.remove((err2) => {
          chai.expect(err2).to.equal(null);

          // Disconnect database
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      chai.expect(error).to.equal(null);
      // Disconnect database
      db.disconnect();
      done();
    });
  });

  it('should check that a string is a string and succeed', stringIsString);
  it('should check that a number is a string and fail', numberIsString);
  it('should check that an object is an object and succeed', objectIsObject);
  it('should check that the key project.id exists and succeed', projectIDExists);
  it('should check that the key project.user exists and fail', projectUserExists);
  it('should check that multiple keys exists and succeed', multipleExist);
  it('should check that a user is an admin which they are', userIsAdmin);
  it('should check that a user is an admin which they are not', userIsNotAdmin);
  it('should create a valid uid', validUID);
  it('should try to create a uid from invalid parameters and fail', invalidUID);
  it('should parse a valid uid', parseValidUID);
  it('should try to parse an invalid uid and fail', parseInvalidUID);
  it('should parse a valid uid and get the second element', parseValidUIDSecondElement);
  it('should return permissions on an internal project', permissionsInternalProject);
  it('should return permissions on a private project', permissionsPrivateProject);
}); // END: describe()

/* --------------------( Test Data )-------------------- */
const sampleObj = {
  project: {
    id: 'myID',
    name: 'The Name',
    org: {
      id: 'myOrgID'
    }
  },
  type: 'Element'
};

/* --------------------( Tests )-------------------- */
/**
 * @description Test assertType() correctly checks for valid type.
 * Note: Possible types: string, object, number, undefined, boolean, symbol
 */
function stringIsString(done) {
  try {
    // Check content of array is of type string.
    utils.assertType(['hello', 'goodbye'], 'string');
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
  // Checks for correct type and returns a boolean
  chai.expect(utils.checkType(['hello', 'goodbye'], 'string')).to.equal(true);
  done();
}

/**
 * @description Test assertType() correctly checks for WRONG type within an array.
 * Note: Possible types: string, object, number, undefined, boolean, symbol
 */
function numberIsString(done) {
  try {
    // Check if array content are of string type
    utils.assertType([1, 2], 'string');
    // Check for false, number do not equal string
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
  }
  // Checks for correct type and returns a boolean
  chai.expect(utils.checkType([1, 2], 'string')).to.equal(false);
  done();
}

/**
 * @description Checks that an object is an object.
 */
function objectIsObject(done) {
  try {
    utils.assertType([{ hello: 'string' }], 'object');
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
  // Checks for correct type and returns a boolean
  chai.expect(utils.checkType([{ hello: 'string' }], 'object')).to.equal(true);
  done();
}

/**
 * @description Checks that the key project.id exists.
 */
function projectIDExists(done) {
  try {
    utils.assertExists(['project.id'], sampleObj);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
  }
  // Checks for correct key and returns true
  chai.expect(utils.checkExists(['project.id'], sampleObj)).to.equal(true);
  done();
}

/**
 * @description Checks that the key project.user exists. Errors if not exist
 */
function projectUserExists(done) {
  try {
    // Check if key 'project.user' exist in sampleObj
    utils.assertExists(['project.user'], sampleObj);
    chai.expect(true).to.equal(false);
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
  }
  // Checks for INCORRECT key and returns false
  chai.expect(utils.checkExists(['project.user'], sampleObj)).to.equal(false);
  done();
}

/**
 * @description Checks that all keys within an array exist else error.
 */
function multipleExist(done) {
  try {
    utils.assertExists(['project.id', 'project.name', 'project.org.id', 'type'], sampleObj);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
  }
  chai.expect(utils.checkExists(['project.name', 'project.org.id'], sampleObj)).to.equal(true);
  done();
}

/**
 * @description Check that a user is an admin and succeed.
 */
function userIsAdmin(done) {
  const user = { name: 'Darth Vader', admin: true };
  try {
    utils.assertAdmin(user);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
  }
  chai.expect(utils.checkAdmin(user)).to.equal(true);
  done();
}

/**
 * @description Check that a user is an admin and fails.
 */
function userIsNotAdmin(done) {
  const user = { name: 'Stormtrooper 123', admin: false };
  try {
    utils.assertAdmin(user);
    chai.expect(true).to.equal(false);
  }
  catch (error) {
    chai.expect(error.status).to.equal(401);
  }
  chai.expect(utils.checkAdmin(user)).to.equal(false);
  done();
}

/**
 * @description Creates a uid from valid parameters
 */
function validUID(done) {
  try {
    const uid = utils.createUID('org', 'project', 'element');
    chai.expect(uid).to.equal('org:project:element');
    done();
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
}

/**
 * @description Creates a uid from invalid parameters
 */
function invalidUID(done) {
  try {
    utils.createUID('org', 'project', 9);
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.description).to.equal('Value is not a string.');
    done();
  }
}

/**
 * @description Parse a valid uid. Checks array element exist.
 */
function parseValidUID(done) {
  try {
    const uid = utils.parseUID('org:project:element');
    chai.expect(uid).to.include('org');
    chai.expect(uid).to.include('project');
    chai.expect(uid).to.include('element');
    done();
  }
  catch (error) {
    chai.expect(error.description).to.equal(null);
    done();
  }
}

/**
 * @description Parse an invalid uid. Expected error.
 */
function parseInvalidUID(done) {
  try {
    utils.parseUID('not a valid uid');
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.description).to.equal('Invalid UID.');
    chai.expect(error.status).to.equal(400);
    done();
  }
}

/**
 * @description Parse a valid uid and get the 2nd element.
 */
function parseValidUIDSecondElement(done) {
  try {
    const project = utils.parseUID('org:project:element', 2);
    chai.expect(project).to.equal('project');
    done();
  }
  catch (error) {
    chai.expect(error.description).to.equal(null);
    done();
  }
}

/**
 * @description Test internal project visibility. Gives non-admin user within the same organization
 * read access to an 'internal' project.
 */
function permissionsInternalProject(done) {
  // Admin sets read permission for non-admin user
  OrgController.setPermissions(admin, org.id, nonAdmin, 'read')
  // Find the project
  .then(() => ProjectController.findProject(admin, org.id, intProj.id))
  .then((proj) => {
    // Get non-admin permission from current
    const intProjPerm = utils.getPermissionStatus(nonAdmin, proj);
    // Check that the non-admin user now has read permission
    chai.expect(intProjPerm).to.include('read');

    // Checks non-admin has read permission
    const intProjRead = utils.checkAccess(nonAdmin, proj, 'read');
    chai.expect(intProjRead).to.equal(true);

    // Checks non-admin has write permission, expected to be false
    const intProjWrite = utils.checkAccess(nonAdmin, proj, 'write');
    chai.expect(intProjWrite).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description Test user permissions on a private project
 * when the user is not part of the project within the same organization.
 */
function permissionsPrivateProject(done) {
  // Find project
  ProjectController.findProject(admin, org.id, privProj.id)
  .then((proj) => {
    // Get project's permission for non-admin user
    const privProjPerm = utils.getPermissionStatus(nonAdmin, proj);

    // Test permission to be empty
    chai.expect(privProjPerm).to.be.empty; // eslint-disable-line no-unused-expressions

    // Check if non-admin user has read access
    const privProjRead = utils.checkAccess(nonAdmin, proj, 'read');
    chai.expect(privProjRead).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
    done();
  });
}
