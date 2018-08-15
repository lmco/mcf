/**
 * @module test/403-project-controller
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  This tests the Project Controller functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The project controller tests create,
 * update, find, soft delete, hard delte, and permissions of projects. As well
 * as test the controlls with invalid inputs.
 */

// Load node modules
const chai = require('chai');
const mongoose = require('mongoose'); // TODO - remove need for mongoose

// Load MBEE modules
const UserController = M.require('controllers.UserController');
const OrgController = M.require('controllers.OrganizationController');
const ProjController = M.require('controllers.ProjectController');
const ElemController = M.require('controllers.ElementController');
const User = M.require('models.User');
const Element = M.require('models.Element');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');

/* --------------------( Test Data )-------------------- */

let nonAuser = null;
let allSeeingUser = null;
let org = null;
let project = null;


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * TODO - add description
   */
  before((done) => {
    const db = M.require('lib/db');
    db.connect();

    // Creating a Requesting Admin
    const u = M.config.test.username;
    const p = M.config.test.password;
    const params = {};
    const body = {
      username: u,
      password: p
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();
    AuthController.authenticate(reqObj, resObj, (err) => {
      const ldapuser = reqObj.user;
      chai.expect(err).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);
      User.findOneAndUpdate({ username: u }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          allSeeingUser = userUpdate;
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);
          // Creating a non admin user
          const nonAuserData = {
            username: 'pepperpotts',
            password: 'gfoftonystark',
            fname: 'Pepper',
            lname: 'Potts',
            admin: false
          };
          UserController.createUser(allSeeingUser, nonAuserData)
          .then((nonAu) => {
            nonAuser = nonAu;
            chai.expect(nonAu.username).to.equal('pepperpotts');
            chai.expect(nonAu.fname).to.equal('Pepper');
            chai.expect(nonAu.lname).to.equal('Potts');
            // Creating an organization using in the tests
            const orgData = {
              id: 'starkhq',
              name: 'Stark Headquarts',
              permissions: {
                admin: [allSeeingUser._id],
                write: [allSeeingUser._id],
                read: [allSeeingUser._id]
              }
            };
            return OrgController.createOrg(allSeeingUser, orgData);
          })
          .then((retOrg) => {
            org = retOrg;
            chai.expect(retOrg.id).to.equal('starkhq');
            chai.expect(retOrg.name).to.equal('Stark Headquarts');
            chai.expect(retOrg.permissions.read).to.include(allSeeingUser._id.toString());
            chai.expect(retOrg.permissions.write).to.include(allSeeingUser._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(allSeeingUser._id.toString());
            done();
          })
          .catch((error) => {
            chai.expect(error.description).to.equal(null);
            done();
          });
        });
    });
  });


  /**
   * After: run after all tests.
   * TODO - add description
   */
  after((done) => {
    // Removing the organization created
    OrgController.removeOrg(allSeeingUser, 'starkhq', { soft: false })
    .then(() => {
      // Removing the non admin user

      const userTwo = 'pepperpotts';
      return UserController.removeUser(allSeeingUser, userTwo);
    })
    .then((delUser2) => {
      chai.expect(delUser2).to.equal('pepperpotts');
      User.findOne({
        username: M.config.test.username
      }, (err, user) => {
        chai.expect(err).to.equal(null);
        user.remove((err2) => {
          chai.expect(err2).to.equal(null);
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      chai.expect(error.description).to.equal(null);
      db.disconnect();
      done();
    });
  });

  /* Execute the tests */
  it('should create a new project', createProject);
  it('should create elements for the project', createElements);
  it('should throw an error saying the field cannot be updated', updateFieldError);
  it('should throw an error saying the field is not of type string', updateTypeError);
  it('should update a project', updateProject);
  it('should update a project using the Project object', updateProjectObject);
  it('should create a second project', createProject02);
  it('should fail to attempt to create a project with a long ID', createLongId);
  it('should attempt to create a project with a long name', createLongName);
  it('should reject attempt to create a project with a REALLY long name', createLongName02);
  it('should reject attempt to create a project with a period in name', createPeriodName);
  it('should reject creation of a project already made', recreateProject);
  it('should reject creation of project with invalid ID', noId);
  it('should reject creation of project with invalid Name', noName);
  it('should reject creation of project with invalid Org', noOrg);
  it('should reject creation of project with non-A user', nonACreator);
  it('should find a project', findProj);
  it('should not find a project', noProj);
  it('should update the original project', updateProj);
  it('should reject update to the id name', updateID);
  it('should reject non-A user from finding a project', nonAUser);
  it('should reject updating due to non-A user', updateNonA);
  it('should find the permissions on the project', findPerm);
  it('should set the permissions on the project', setPerm);
  it('should soft-delete a project', softDeleteProject);
  it('should delete a project', deleteProject);
  it('should delete second project', deleteProject02);
  it('should delete projects that were created with long names', deleteOthers);
});


/* --------------------( Tests )-------------------- */


/**
 * Tests creating a project
 */
function createProject(done) {
  const projData = {
    id: 'ironman',
    name: 'Iron man Suite',
    org: {
      id: 'starkhq'
    },
    custom: {
      builtFor: 'Tony'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((retProj) => ProjController.findProject(allSeeingUser, 'starkhq', retProj.id))
  .then((proj) => {
    chai.expect(proj.id).to.equal('ironman');
    chai.expect(proj.name).to.equal('Iron man Suite');
    chai.expect(proj.custom.builtFor).to.equal('Tony');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}


/**
 * Creates elements for the main project
 */
function createElements(done) {
  const elem0 = {
    id: '0000',
    name: 'smart missiles',
    project: {
      id: 'ironman',
      org: {
        id: 'starkhq'
      }
    },
    type: 'Block'
  };
  ElemController.createElement(allSeeingUser, elem0)
  .then(() => {
    const elem1 = {
      id: '0001',
      name: 'JARVIS',
      project: {
        id: 'ironman',
        org: {
          id: 'starkhq'
        }
      },
      type: 'Block'
    };
    return ElemController.createElement(allSeeingUser, elem1);
  })
  .then(() => {
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}


/**
 * Test update to a project field with an
 * invalid attempt at updating the id.
 * This will reject and throw an error.
 */
function updateFieldError(done) {
  ProjController.updateProject(allSeeingUser, org.id, 'ironman', { id: 'shouldnotchange' })
  .then((proj) => {
    chai.expect(typeof proj).to.equal('undefined');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Users cannot update [id] of Projects.');
    done();
  });
}


/**
 * Tests update to a project with an invalid
 * name for the project. This will reject and throw
 * and error.
 */
function updateTypeError(done) {
  ProjController.updateProject(allSeeingUser, org.id, 'ironman', { name: [] })
  .then((proj) => {
    chai.expect(typeof proj).to.equal('undefined');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('The Project [name] is not of type String');
    done();
  });
}


/**
 * Test updating a project with a
 * new name.
 */
function updateProject(done) {
  ProjController.updateProject(allSeeingUser, org.id, 'ironman', { id: 'ironman', name: 'Iron Man' })
  .then((proj) => {
    chai.expect(proj.name).to.equal('Iron Man');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}


/**
 * Test updating a project with using project object.
 */
function updateProjectObject(done) {
  ProjController.findProject(allSeeingUser, org.id, 'ironman')
  .then((projectFound) => {
    projectFound.name = 'Iron Man Two';
    return ProjController.updateProject(allSeeingUser, org.id, 'ironman', projectFound);
  })
  .then((projectUpdated) => {
    chai.expect(projectUpdated.name).to.equal('Iron Man Two');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}


/**
 * Tests creating a second project
 */
function createProject02(done) {
  const projData = {
    id: 'arcreactor',
    name: 'Arc Reactor',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    project = proj;
    chai.expect(proj.id).to.equal('arcreactor');
    chai.expect(proj.name).to.equal('Arc Reactor');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}


/**
 * Tests to see what valid name of the id
 * can be of a project. how long till it breaks...
 */
function createLongId(done) {
  const projData = {
    id: 'thisisaverylongidnamepleaseacceptmeorbreak',
    name: 'Long Id',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // Should fail, throw error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Save failed.');
    done();
  });
}


/**
 * Tests to see how long a name of a project can be.
 */
function createLongName(done) {
  const projData = {
    id: 'vlongname',
    name: 'This is Tony Stark I am writing to see if this is valid are you from here on i am adding more because it worked with what i had at you',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('vlongname');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests to see what valid length of the name
 * of project can be.
 */
function createLongName02(done) {
  const projData = {
    id: 'vlongnametwo',
    name: 'This is Tony Stark I am writing to see if this is valid are you from here on i am adding more because it worked with what i had at you i want to see you break because this is gettting really long and I want you to break please break I want to see you break',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('vlongnametwo');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests to see the validation of a name of a project.
 */
function createPeriodName(done) {
  const projData = {
    id: 'period',
    name: 'This is just to see if a period works....',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // Should fail, throw error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project name is not valid.');
    done();
  });
}

/**
 * Test creating a project already existing.
 * This should throw an error stating the project already
 * exists.
 */
function recreateProject(done) {
  const projData = {
    id: 'arcreactor',
    name: 'Small Arc Reactor',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project already exists.');
    done();
  });
}

/**
 * Tests creating a project that has no project id input.
 * This should be rejected and throw an error.
 */
function noId(done) {
  const projData = {
    id: '',
    name: 'denyme',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project ID is not valid.');
    done();
  });
}

/**
 * Tests creating a project that has no name input.
 * This should be rejected and throw an error.
 */
function noName(done) {
  const projData = {
    id: 'imfake',
    name: '',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project name is not valid.');
    done();
  });
}

/**
 * Test creating a project that has no organization id.
 * This should be rejected and throw an error.
 */
function noOrg(done) {
  const projData = {
    id: 'imfake',
    name: 'starkhq',
    org: {
      id: ''
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Org not found.');
    done();
  });
}

/**
 * Tests for creating a project using a non admin user.
 * Should output error.
 */

function nonACreator(done) {
  const projData = {
    id: 'iamnoadmin',
    name: 'dontmakeme',
    org: {
      id: 'starkhq'
    }
  };
  ProjController.createProject(nonAuser, projData)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permissions.');
    done();
  });
}


/**
 * Test for finding the project that was
 * just created above.
 */

function findProj(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';
  ProjController.findProject(allSeeingUser, orgId, projId)
  .then((proj) => {
    chai.expect(proj.id).to.equal('ironman');
    chai.expect(proj.name).to.equal('Iron Man Two');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Test for finding a project that does not exist.
 * An error should be thrown.
 */

function noProj(done) {
  const orgId = 'starkhq';
  const projId = 'fakeproj';
  ProjController.findProject(allSeeingUser, orgId, projId)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project not found.');
    done();
  });
}

/**
 * Test for finding a project using a non admin user.
 * An error should be thrown.
 */

function nonAUser(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';
  ProjController.findProject(nonAuser, orgId, projId)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Test for updating a project.
 */

function updateProj(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';
  const updateData = {
    name: 'Tony Stark',
    custom: {
      builtFor: 'Rhodey',
      version: 2.0
    }
  };
  ProjController.updateProject(allSeeingUser, orgId, projId, updateData)
  .then(() => ProjController.findProject(allSeeingUser, orgId, projId))
  .then((proj) => {
    chai.expect(proj.id).to.equal('ironman');
    chai.expect(proj.name).to.equal('Tony Stark');
    chai.expect(proj.custom.builtFor).to.equal('Rhodey');
    chai.expect(proj.custom.version).to.equal(2.0);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests for updating the projects id name.
 * An error should be thrown.
 */

function updateID(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';
  const updateData = {
    id: 'newironman'
  };
  ProjController.updateProject(allSeeingUser, orgId, projId, updateData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('newironman');
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Users cannot update [id] of Projects.');
    done();
  });
}

/**
 * Tests for updating a project with a non admin user.
 * An error should be thrown.
 */

function updateNonA(done) {
  const orgId = 'starkhq';
  const projId = 'arcreactor';
  const updateData = {
    name: 'Baby Arc Reactor'
  };
  ProjController.updateProject(nonAuser, orgId, projId, updateData)
  .then(() => {
    // should never come in then
    // should throw error incase
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Tests finding all permisions on the project.
 */
function findPerm(done) {
  ProjController.findPermissions(allSeeingUser, org.id, 'ironman', allSeeingUser)
  .then((perm) => {
    chai.expect(perm.read).to.equal(true);
    chai.expect(perm.write).to.equal(true);
    chai.expect(perm.admin).to.equal(true);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests setting permissions on the project where you need
 * permission to the org before permissions can be set to
 * the project.
 */
function setPerm(done) {
  OrgController.setPermissions(allSeeingUser, 'starkhq', nonAuser, 'write')
  .then(() => ProjController.setPermissions(allSeeingUser, 'starkhq', project.id.toString(), nonAuser, 'write'))
  .then(() => ProjController.findProject(allSeeingUser, 'starkhq', project.id.toString()))
  .then((retProj) => {
    chai.expect(retProj.permissions.write[1]._id.toString()).to.equal(nonAuser._id.toString());
    chai.expect(retProj.permissions.read[1]._id.toString()).to.equal(nonAuser._id.toString());
    chai.expect(retProj.permissions.admin.length).to.equal(1);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal(null);
    done();
  });
}

/**
 * Tests soft-deleting a project
 */
function softDeleteProject(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'ironman', { soft: true })
  .then(() => ProjController.findProject(allSeeingUser, org.id, 'ironman'))
  .then((proj2) => {
    chai.expect(proj2).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project not found.');
    done();
  });
}

/**
 * Tests deleting a project
 */
function deleteProject(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'ironman', { soft: false })
  .then(() => ProjController.findProject(allSeeingUser, org.id, 'ironman'))
  .then((proj2) => {
    chai.expect(proj2).to.equal(null);
    // Check if elements still exist
    Element.Element.find({ id: '0000' })
    .populate()
    .exec((findElementError, element) => {
      chai.expect(element).to.equal(null);
      done();
    });
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project not found.');
    done();
  });
}

/**
 * Tests deleting second project
 */
function deleteProject02(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'arcreactor', { soft: false })
  .then(() => ProjController.findProject(allSeeingUser, org.id, 'arcreactor'))
  .then((proj2) => {
    chai.expect(proj2).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project not found.');
    done();
  });
}

/**
 * Tests deleting all the other projects created
 */
function deleteOthers(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'vlongname', { soft: false })
  .then(() => ProjController.findProject(allSeeingUser, org.id, 'vlongname'))
  .then((proj) => {
    chai.expect(proj).to.equal(null);
    done();
  })
  .catch((error) => {
    chai.expect(error.description).to.equal('Project not found.');
    ProjController.removeProject(allSeeingUser, org.id, 'vlongnametwo', { soft: false })
    .then(() => ProjController.findProject(allSeeingUser, org.id, 'vlongnametwo'))
    .then((proj2) => {
      chai.expect(proj2).to.equal(null);
      done();
    })
    .catch((error2) => {
      chai.expect(error2.description).to.equal('Project not found.');
      done();
    });
  });
}
