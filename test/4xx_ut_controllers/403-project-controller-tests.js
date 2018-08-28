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

// Load NPM modules
const chai = require('chai');

// Load MBEE modules
const UserController = M.require('controllers.user-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const Element = M.require('models.element');
const User = M.require('models.user');
const AuthController = M.require('lib.auth');
const mockExpress = M.require('lib.mock-express');
const db = M.require('lib.db');
const utils = M.require('lib.utils');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
let nonAuser = null;
let adminUser = null;
let org = null;
let project = null;


/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Run before all test. Create non-admin user and organization.
   */
  before((done) => {
    db.connect();

    // Creating a Requesting Admin
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    AuthController.authenticate(reqObj, resObj, (error) => {
      const ldapuser = reqObj.user;
      chai.expect(error).to.equal(null);
      chai.expect(ldapuser.username).to.equal(M.config.test.username);

      // Find the user and update admin status
      User.findOneAndUpdate({ username: ldapuser.username }, { admin: true }, { new: true },
        (updateErr, userUpdate) => {
          // Setting it equal to global variable
          adminUser = userUpdate;
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
          UserController.createUser(adminUser, nonAuserData)
          .then((nonAu) => {
            nonAuser = nonAu;
            chai.expect(nonAu.username).to.equal('pepperpotts');
            chai.expect(nonAu.fname).to.equal('Pepper');
            chai.expect(nonAu.lname).to.equal('Potts');

            // Creating organization used in tests
            const orgData = {
              id: 'starkhq',
              name: 'Stark Headquarts',
              permissions: {
                admin: [adminUser._id],
                write: [adminUser._id],
                read: [adminUser._id]
              }
            };
            return OrgController.createOrg(adminUser, orgData);
          })
          .then((retOrg) => {
            org = retOrg;
            chai.expect(retOrg.id).to.equal('starkhq');
            chai.expect(retOrg.name).to.equal('Stark Headquarts');
            chai.expect(retOrg.permissions.read).to.include(adminUser._id.toString());
            chai.expect(retOrg.permissions.write).to.include(adminUser._id.toString());
            chai.expect(retOrg.permissions.admin).to.include(adminUser._id.toString());
            done();
          })
          .catch((error2) => {
            chai.expect(error2.message).to.equal(null);
            done();
          });
        });
    });
  });

  /**
   * After: Run after all tests. Remove non-admin user and organization.
   */
  after((done) => {
    // Removing the organization created
    OrgController.removeOrg(adminUser, 'starkhq', { soft: false })
    .then(() => {
      // Removing the non-admin user
      const userTwo = 'pepperpotts';
      return UserController.removeUser(adminUser, userTwo);
    })
    .then((delUser2) => {
      chai.expect(delUser2).to.equal('pepperpotts');
      User.findOne({
        username: M.config.test.username
      }, (error, user) => {
        chai.expect(error).to.equal(null);
        user.remove((error2) => {
          chai.expect(error2).to.equal(null);
          db.disconnect();
          done();
        });
      });
    })
    .catch((error) => {
      chai.expect(error.message).to.equal(null);
      db.disconnect();
      done();
    });
  });

  /* Execute the tests */
  it('should create a new project', createProject);
  it('should throw an error saying the field cannot be updated', rejectImmutableField);
  it('should throw an error saying the field is not of type string', updateTypeError);
  it('should update a project', updateProjectName);
  it('should update a project using the Project object', updateProjectObject);
  it('should create a second project', createProject02);
  it('should reject attempt to create a project with a period in name', createPeriodName);
  it('should reject creation of a project already made', rejectDuplicateProjectId);
  it('should reject creation of project with invalid ID', rejectInvalidProjectId);
  it('should reject creation of project with invalid Name', rejectInvalidProjectName);
  it('should reject creation of project with invalid Org', rejectInvalidOrgId);
  it('should reject creation of project with non-A user', rejectNonAdminCreateProject);
  it('should find a project', findProj);
  it('should not find a project', rejectFindNonexistentProject);
  it('should update the original project', updateProj);
  it('should reject update to the id name', rejectProjectId);
  it('should reject non-A user from finding a project', nonAUser);
  it('should reject updating due to non-A user', rejectNonAdminProjectUpdate);
  it('should find the permissions on the project', findPerm);
  // it('should set the permissions on the project', setPerm);
  // TODO: MBX-330: User need to be part of org before project permission set.
  it('should soft-delete a project', softDeleteProject);
  it('should delete a project', deleteProject);
  it('should delete second project', deleteProject02);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies project is created.
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

  // Create the project via project controller
  ProjController.createProject(adminUser, projData)
  .then((retProj) => ProjController.findProject(adminUser, 'starkhq', retProj.id))
  .then((proj) => {
    // Set the file-global project
    project = proj;

    // Verify project was created successfully
    chai.expect(proj.id).to.equal('ironman');
    chai.expect(proj.name).to.equal('Iron man Suite');
    chai.expect(proj.custom.builtFor).to.equal('Tony');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project object cannot update immutable field.
 * Expected error thrown: 'Bad Request'
 */
function rejectImmutableField(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, 'ironman', { id: 'shouldnotchange' })
  .then((proj) => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies user CANNOT update project with invalid project name.
 * Expected error thrown: 'Bad Request'
 */
function updateTypeError(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, 'ironman', { name: [] })
  .then((proj) => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies project updates with new name.
 */
function updateProjectName(done) {
  // Update project
  ProjController.updateProject(adminUser, org.id, 'ironman', { id: 'ironman', name: 'Iron Man' })
  .then((proj) => {
    // Verify project name
    chai.expect(proj.name).to.equal('Iron Man');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project updates with project model object.
 */
function updateProjectObject(done) {
  // Find project
  ProjController.findProject(adminUser, org.id, 'ironman')
  .then((projectFound) => {
    projectFound.name = 'Iron Man Two';
    return ProjController.updateProject(adminUser, org.id, 'ironman', projectFound);
  })
  .then((projectUpdated) => {
    // Verify project updated
    chai.expect(projectUpdated.name).to.equal('Iron Man Two');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies second project is create.
 */
function createProject02(done) {
  const projData = {
    id: 'arcreactor',
    name: 'Arc Reactor',
    org: {
      id: 'starkhq'
    }
  };
  // Create project
  ProjController.createProject(adminUser, projData)
  .then((proj) => {
    // Verfy project fields
    chai.expect(proj.id).to.equal('arcreactor');
    chai.expect(proj.name).to.equal('Arc Reactor');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project name does not contain periods.
 * Expected error thrown: 'Bad Request'
 */
function createPeriodName(done) {
  const projData = {
    id: 'period',
    name: 'This is just to see if a period works....',
    org: {
      id: 'starkhq'
    }
  };
  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should fail, throw error
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies existing projects CANNOT be recreated.
 * Expected error thrown: 'Bad Request'
 */
function rejectDuplicateProjectId(done) {
  const projData = {
    id: 'arcreactor',
    name: 'Small Arc Reactor',
    org: {
      id: 'starkhq'
    }
  };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verfies user CANNOT create project with invalid ID.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidProjectId(done) {
  const projData = {
    id: '',
    name: 'denyme',
    org: {
      id: 'starkhq'
    }
  };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Project ID is not valid.'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies user CANNOT create a project without name input.
 * Expected error thrown: 'Bad Request'
 */
function rejectInvalidProjectName(done) {
  const projData = {
    id: 'imfake',
    name: '',
    org: {
      id: 'starkhq'
    }
  };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies user CANNOT create project without organization id.
 * Expected error thrown: 'Not Found'
 */
function rejectInvalidOrgId(done) {
  const projData = {
    id: 'imfake',
    name: 'starkhq',
    org: {
      id: ''
    }
  };

  // Create project
  ProjController.createProject(adminUser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies non-admin CANNOT create a project.
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have write permissions with Org
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminCreateProject(done) {
  const projData = {
    id: 'iamnoadmin',
    name: 'dontmakeme',
    org: {
      id: 'starkhq'
    }
  };

  // Create project
  ProjController.createProject(nonAuser, projData)
  .then(() => {
    // Expected createProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verify project created in createProject() is found.
 */
function findProj(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';

  // Find project
  ProjController.findProject(adminUser, orgId, projId)
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal('ironman');
    chai.expect(proj.name).to.equal('Iron Man Two');
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies NONEXISTENT project does not exist.
 * Expected error thrown: 'Not Found'
 */
function rejectFindNonexistentProject(done) {
  const orgId = 'starkhq';
  const projId = 'fakeproj';

  // Find project
  ProjController.findProject(adminUser, orgId, projId)
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.expect(true).to.equal(false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies non-admin user CANNOT find project
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have read permissions with Org
 * Expected error thrown: 'Unauthorized'
 */
function nonAUser(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';

  // Find project
  ProjController.findProject(nonAuser, orgId, projId)
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @description Verifies project updates.
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

  // Update project
  ProjController.updateProject(adminUser, orgId, projId, updateData)
  .then(() => ProjController.findProject(adminUser, orgId, projId))
  .then((proj) => {
    // Verify project fields
    chai.expect(proj.id).to.equal('ironman');
    chai.expect(proj.name).to.equal('Tony Stark');
    chai.expect(proj.custom.builtFor).to.equal('Rhodey');
    chai.expect(proj.custom.version).to.equal(2.0);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies immutable project Id CANNOT be updated.
 * Expected error thrown: 'Bad Request'
 */
function rejectProjectId(done) {
  const orgId = 'starkhq';
  const projId = 'ironman';
  const updateData = {
    id: 'newironman'
  };

  // Update project
  ProjController.updateProject(adminUser, orgId, projId, updateData)
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Bad Request'
    chai.expect(error.message).to.equal('Bad Request');
    done();
  });
}

/**
 * @description Verifies non-admin CANNOT update project.
 * Note: non-admin is NOT a site wide admin
 *       non-admin does NOT have admin permissions with project
 * Expected error thrown: 'Unauthorized'
 */
function rejectNonAdminProjectUpdate(done) {
  const orgId = 'starkhq';
  const projId = 'arcreactor';
  const updateData = {
    name: 'Baby Arc Reactor'
  };

  // Update project
  ProjController.updateProject(nonAuser, orgId, projId, updateData)
  .then(() => {
    // Expected updateProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Unauthorized'
    chai.expect(error.message).to.equal('Unauthorized');
    done();
  });
}

/**
 * @decription Verifies correct permissions found on project.
 */
function findPerm(done) {
  // Find permissions
  ProjController.findPermissions(adminUser, org.id, 'ironman', adminUser)
  .then((perm) => {
    // Verfy permissions
    chai.expect(perm.read).to.equal(true);
    chai.expect(perm.write).to.equal(true);
    chai.expect(perm.admin).to.equal(true);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Admin user sets then verifies non-admin has write/read permissions on project.
 */
// TODO: If keeping function, remove the eslint-disable-line below
function setPerm(done) { // eslint-disable-line no-unused-vars
  // Admin sets permissions for non-admin
  ProjController.setPermissions(adminUser, 'starkhq', project.id.toString(), nonAuser, 'write')
  .then(() => ProjController.findProject(adminUser, 'starkhq', project.id.toString()))
  .then((retProj) => {
    // Verify permissions for non-admin
    chai.expect(retProj.permissions.write[1]._id.toString()).to.equal(nonAuser._id.toString());
    chai.expect(retProj.permissions.read[1]._id.toString()).to.equal(nonAuser._id.toString());
    chai.expect(retProj.permissions.admin.length).to.equal(1);
    done();
  })
  .catch((error) => {
    // Expect no error
    chai.expect(error.message).to.equal(null);
    done();
  });
}

/**
 * @description Verifies project NOT found after soft-deletion.
 * Expected error thrown: 'Not Found'
 */
function softDeleteProject(done) {
  // Create an element via the Element model
  const elem = new Element.Block({
    id: '0000',
    uid: utils.createUID(org.id, project.id, '0000'),
    project: project._id
  });

  // Save the element
  elem.save()
  // Soft-delete the project
  .then(() => ProjController.removeProject(adminUser, org.id, 'ironman', { soft: true }))
  // Find project
  .then(() => ProjController.findProject(adminUser, org.id, 'ironman'))
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}

/**
 * @description Verifies project NOT found after deletion.
 * Expected error thrown: 'Not Found'
 */
function deleteProject(done) {
  // Hard-delete the project
  ProjController.removeProject(adminUser, org.id, 'ironman', { soft: false })
  .then(() => ProjController.findProject(adminUser, org.id, 'ironman'))
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');

    // Check if elements still exist
    // Note: Elements are deleted with projects
    Element.Element.findOne({ id: '0000' })
    .exec((findElementError, element) => {
      // Expect no element
      chai.expect(element).to.equal(null);
      done();
    });
  });
}

/**
 * @description Verifies project NOT found after deletion.
 * Expected error thrown: 'Not Found'
 */
function deleteProject02(done) {
  // Remove project
  ProjController.removeProject(adminUser, org.id, 'arcreactor', { soft: false })
  .then(() => ProjController.findProject(adminUser, org.id, 'arcreactor'))
  .then(() => {
    // Expected findProject() to fail
    // Should not execute, force test to fail
    chai.assert(true === false);
    done();
  })
  .catch((error) => {
    // Expected error thrown: 'Not Found'
    chai.expect(error.message).to.equal('Not Found');
    done();
  });
}
