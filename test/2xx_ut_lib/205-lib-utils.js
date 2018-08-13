/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/205-lib-utils
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
 * @description  This file tests the utility functions.
 */

const chai = require('chai');
const M = require('../../mbee.js');
const utils = M.require('lib/utils'); // TODO - can we do M.lib.utils?
const mongoose = require('mongoose'); // TODO - remove need for mongoose
const OrgController = M.require('controllers.OrganizationController');
const ProjectConttroller = M.require('controllers.ProjectController');
const UserController = M.require('controllers.UserController');
const User = M.require('models.User');


let admin = null;
let nonAdmin = null;
let privOrg = null;
let pubOrg = null;
let pubProj = null;
let intProj = null;
let privProj = null;
let privProjPubOrg = null;


/* --------------------( Main )-------------------- */

describe(M.getModuleName(module.filename), () => {
  before((done) => {
    const db = M.require('lib/db');
    db.connect();

    admin = new User({
      username: 'adminuser',
      password: 'password',
      admin: true
    });

    admin.save((saveUserErr) => {
      chai.expect(saveUserErr).to.equal(null);
      const nonAdminData = {
        username: 'nonadminuser',
        password: 'password'
      };
      UserController.createUser(admin, nonAdminData)
      .then((user) => {
        nonAdmin = user;
        return OrgController.createOrg(admin, { id: 'priv', name: 'Private Org' });
      })
      .then((org) => {
        privOrg = org;
        return OrgController.createOrg(admin, { id: 'pub', name: 'Public', visibility: 'public' });
      })
      .then((org) => {
        pubOrg = org;
        const pubProjData = {
          id: 'pubproj',
          name: 'Public Project',
          org: {
            id: privOrg.id
          },
          visibility: 'public'
        };
        return ProjectConttroller.createProject(admin, pubProjData);
      })
      .then((proj) => {
        pubProj = proj;
        const intProjData = {
          id: 'intproj',
          name: 'Public Project',
          org: {
            id: privOrg.id
          },
          visibility: 'internal'
        };
        return ProjectConttroller.createProject(admin, intProjData);
      })
      .then((proj) => {
        intProj = proj;
        const privProjData = {
          id: 'privproj',
          name: 'Public Project',
          org: {
            id: privOrg.id
          },
          visibility: 'private'
        };
        return ProjectConttroller.createProject(admin, privProjData);
      })
      .then((proj) => {
        privProj = proj;
        const privProjPubOrgData = {
          id: 'privprojpuborg',
          name: 'Public Project',
          org: {
            id: pubOrg.id
          },
          visibility: 'private'
        };
        return ProjectConttroller.createProject(admin, privProjPubOrgData);
      })
      .then((proj) => {
        privProjPubOrg = proj;
        done();
      })
      .catch((error) => {
        chai.expect(error).to.equal(null);
        done();
      });
    });
  });


  after((done) => {
    OrgController.removeOrg(admin, 'priv', { soft: false })
    .then(() => OrgController.removeOrg(admin, 'pub', { soft: false }))
    .then(() => UserController.removeUser(admin, 'nonadminuser'))
    .then(() => {
      User.findOne({
        username: 'adminuser'
      }, (err, foundUser) => {
        chai.expect(err).to.equal(null);
        foundUser.remove((err2) => {
          chai.expect(err2).to.equal(null);
          mongoose.connection.close();
          done();
        });
      });
    })
    .catch((error) => {
      chai.expect(error).to.equal(null);
      mongoose.connection.close();
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
  it('should return permissions on a public project', permissionsPublicProject);
  it('should return permissions on an internal project', permissionsInternalProject);
  it('should return permissions on a private project', permissionsPrivateProject);
  it('should return permissions on a public org', permissionsPublicOrg);
});


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
 * @description Checks that a string is a string.
 *
 * TODO - Does the test really check that a string is a string or are we testing
 * that the assertType function works using string input? Cleanup descriptions
 * on this and other tests.
 */
function stringIsString(done) {
  try {
    utils.assertType(['hello', 'goodbye'], 'string');
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
  chai.expect(utils.checkType(['hello', 'goodbye'], 'string')).to.equal(true);
  done();
}


/**
 * @description Checks that a number is a string.
 */
function numberIsString(done) {
  try {
    utils.assertType([1, 2], 'string');
    // TODO - add comment explaining the line below
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
  }
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
  chai.expect(utils.checkType([{ hello: 'string' }], 'object')).to.equal(true);
  done();
}


/**
 * @description Checks that the key project.id exists.
 * TODO - This test got messy after a merge, let's fix it.
 */
function projectIDExists(done) {
  try {
    utils.assertExists(['project.id'], sampleObj);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
  }
  chai.expect(utils.checkExists(['project.id'], sampleObj)).to.equal(true);
  done();
}


/**
 * @description Checks that the key project.user exists.
 *
 * TODO - consider explaining that the assert function is expected to throw
 * an error that should be caught in the catch block.
 *
 * TODO - This test got messy after a merge, let's fix it.
 */
function projectUserExists(done) {
  try {
    utils.assertExists(['project.user'], sampleObj);
    chai.expect(true).to.equal(false);
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
  }
  chai.expect(utils.checkExists(['project.user'], sampleObj)).to.equal(false);
  done();
}


/**
 * @description Checks that multiple keys exist.
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
 * @description Check that a user is an admin and fail.
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
 * @description  Creates a uid from valid parameters
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
 * @description  Creates a uid from invalid parameters
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
 * @description  Should parse a valid uid.
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
 * @description  Should parse an invalid uid.
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
 * @description  Should parse a valid uid and get the 2nd element.
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
 * @description  Should return user permissions on a public project
 * when the user is not part of the project
 */
function permissionsPublicProject(done) {
  OrgController.setPermissions(admin, 'priv', nonAdmin, 'read')
  .then(() => {
    const pubProjPerm = utils.getPermissionStatus(nonAdmin, pubProj);
    chai.expect(pubProjPerm).to.include('read');
    const pubProjRead = utils.checkAccess(nonAdmin, pubProj, 'read');
    chai.expect(pubProjRead).to.equal(true);
    const pubProjWrite = utils.checkAccess(nonAdmin, pubProj, 'write');
    chai.expect(pubProjWrite).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
    done();
  });
}


/**
 * @description  Should return user permissions on an internal project
 * when the user is not part of the project, but part of the org
 */
function permissionsInternalProject(done) {
  ProjectConttroller.findProject(admin, privOrg.id, intProj.id)
  .then((proj) => {
    const intProjPerm = utils.getPermissionStatus(nonAdmin, proj);
    chai.expect(intProjPerm).to.include('read');
    const intProjRead = utils.checkAccess(nonAdmin, proj, 'read');
    chai.expect(intProjRead).to.equal(true);
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
 * @description  Should return user permissions on a private project
 * when the user is not part of the project, but part of the org
 */
function permissionsPrivateProject(done) {
  ProjectConttroller.findProject(admin, privOrg.id, privProj.id)
  .then((proj) => {
    const privProjPerm = utils.getPermissionStatus(nonAdmin, proj);
    chai.expect(privProjPerm).to.be.empty; // eslint-disable-line no-unused-expressions
    const privProjRead = utils.checkAccess(nonAdmin, proj, 'read');
    chai.expect(privProjRead).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error).to.equal(null);
    done();
  });
}

/**
 * @description  Should return user permissions on a public org
 */
function permissionsPublicOrg(done) {
  const pubOrgPerm = utils.getPermissionStatus(nonAdmin, pubOrg);
  chai.expect(pubOrgPerm).to.include('read');
  const pubOrgRead = utils.checkAccess(nonAdmin, pubOrg, 'read');
  chai.expect(pubOrgRead).to.equal(true);
  const pubOrgPrivProjPerm = utils.getPermissionStatus(nonAdmin, privProjPubOrg);
  chai.expect(pubOrgPrivProjPerm).to.be.empty; // eslint-disable-line no-unused-expressions
  const pubOrgPrivProjRead = utils.checkAccess(nonAdmin, privProjPubOrg, 'read');
  chai.expect(pubOrgPrivProjRead).to.equal(false);
  done();
}
