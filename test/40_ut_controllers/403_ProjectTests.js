/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module  Project Controller Tests
 *
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Tests the project controller
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const ProjController = M.load('controllers/ProjectController');
const UserController = M.load('controllers/UserController');
const OrgController = M.load('controllers/OrganizationController');
const ElemController = M.load('controllers/ElementController');
const Element = M.load('models/Element');

let nonAuser = null;
let allSeeingUser = null;
let org = null;
let project = null;

/**
 *  -Set permissions for a user
 *  -other tests
 */

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  before(function(done) {
    this.timeout(5000);

    const db = M.load('lib/db');
    db.connect();

    // Finding a Requesting Admin
    const username = M.config.test.username;
    UserController.findUser(username)
    .then(function(searchUser) {
      allSeeingUser = searchUser;
      chai.expect(searchUser.username).to.equal(M.config.test.username);
      // Creating a non admin user
      const nonAuserData = {
        username: 'msmith',
        password: 'awwgeezrick',
        fname: 'Morty',
        lname: 'Smith',
        admin: false
      };
      UserController.createUser(allSeeingUser, nonAuserData)
      .then(function(nonAu) {
        nonAuser = nonAu;
        chai.expect(nonAu.username).to.equal('msmith');
        chai.expect(nonAu.fname).to.equal('Morty');
        chai.expect(nonAu.lname).to.equal('Smith');
        // Creating an organization using in the tests
        const orgData = {
          id: 'council',
          name: 'Council of Ricks',
          permissions: {
            admin: [allSeeingUser._id],
            write: [allSeeingUser._id],
            read: [allSeeingUser._id]
          }
        };
        OrgController.createOrg(allSeeingUser, orgData)
        .then((retOrg) => {
          org = retOrg;
          chai.expect(retOrg.id).to.equal('council');
          chai.expect(retOrg.name).to.equal('Council of Ricks');
          chai.expect(retOrg.permissions.read).to.include(allSeeingUser._id.toString());
          chai.expect(retOrg.permissions.write).to.include(allSeeingUser._id.toString());
          chai.expect(retOrg.permissions.admin).to.include(allSeeingUser._id.toString());
          done();
        })
        .catch((firsterr) => {
          const err1 = JSON.parse(firsterr.message);
          chai.expect(err1.description).to.equal(null);
          done();
        });
      })
      .catch(function(error) {
        const err2 = JSON.parse(error.message);
        chai.expect(err2.description).to.equal(null);
        done();
      });
    })
    .catch(function(lasterr) {
      const json = JSON.parse(lasterr.message);
      chai.expect(json.description).to.equal(null);
      done();
    });
  });


  after((done) => {
    // Removing the organization created
    OrgController.removeOrg(allSeeingUser, 'council', { soft: false })
    .then(() => {
      // Removing the non admin user
      const userTwo = 'msmith';
      UserController.removeUser(allSeeingUser, userTwo)
      .then(function(delUser2) {
        chai.expect(delUser2).to.equal('msmith');
        mongoose.connection.close();
        done();
      })
      .catch(function(err1) {
        const error1 = JSON.parse(err1.message);
        chai.expect(error1.description).to.equal(null);
        mongoose.connection.close();
        done();
      });
    })
    .catch(function(err2) {
      const error2 = JSON.parse(err2.message);
      chai.expect(error2.description).to.equal(null);
      mongoose.connection.close();
      done();
    });
  });

  it('should create a new project', createProject).timeout(2500);
  it('should create elements for the project', createElements).timeout(2500);
  it('should throw an error saying the field cannot be updated', updateFieldError).timeout(2500);
  it('should throw an error saying the field is not of type string', updateTypeError).timeout(2500);
  it('should update a project', updateProject).timeout(2500);
  it('should update a project using the Project object', updateProjectObject).timeout(2500);
  it('should create a second project', createProject02).timeout(2500);
  it('should fail to attempt to create a project with a long ID', createLongId).timeout(2500);
  it('should attempt to create a project with a long name', createLongName).timeout(2500);
  it('should reject attempt to create a project with a REALLY long name', createLongName02).timeout(2500);
  it('should reject attempt to create a project with a period in name', createPeriodName).timeout(2500);
  it('should reject creation of a project already made', recreateProject).timeout(2500);
  it('should reject creation of project with invalid ID', noId).timeout(2500);
  it('should reject creation of project with invalid Name', noName).timeout(2500);
  it('should reject creation of project with invalid Org', noOrg).timeout(2500);
  it('should reject creation of project with non-A user', nonACreator).timeout(2500);
  it('should find a project', findProj).timeout(2500);
  it('should not find a project', noProj).timeout(2500);
  it('should update the original project', updateProj).timeout(2500);
  it('should reject update to the id name', updateID).timeout(2500);
  it('should reject non-A user from finding a project', nonAUser).timeout(2500);
  it('should reject updating due to non-A user', updateNonA).timeout(2500);
  it('should find the permissions on the project', findPerm).timeout(2500);
  it('should set the permissions on the project', setPerm).timeout(5000);
  it('should soft-delete a project', softDeleteProject).timeout(2500);
  it('should delete a project', deleteProject).timeout(5000);
  it('should delete second project', deleteProject02).timeout(5000);
  it('should delete projects that were created with long names', deleteOthers).timeout(5000);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Tests creating a project
 */
function createProject(done) {
  const projData = {
    id: 'prtlgn',
    name: 'portal gun',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('prtlgn');
    chai.expect(proj.name).to.equal('portal gun');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Creates elements for the main project
 */
function createElements(done) {
  const elem0 = {
    id: '0000',
    name: 'Trigger',
    project: {
      id: 'prtlgn',
      org: {
        id: 'council'
      }
    },
    type: 'Element'
  };
  ElemController.createElement(allSeeingUser, elem0)
  .then((element) => {
    const elem1 = {
      id: '0001',
      name: 'Handle',
      project: {
        id: 'prtlgn',
        org: {
          id: 'council'
        }
      },
      type: 'Element'
    };
    ElemController.createElement(allSeeingUser, elem1)
    .then((element2) => {
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal(null);
      done();
    });
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

function updateFieldError(done) {
  ProjController.updateProject(allSeeingUser, org.id, 'prtlgn', { id: 'shouldNotChange' })
  .then((proj) => {
    chai.expect(typeof proj).to.equal('undefined');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('Users cannot update [id] of Projects.');
    done();
  });
}

function updateTypeError(done) {
  ProjController.updateProject(allSeeingUser, org.id, 'prtlgn', { name: [] })
  .then((proj) => {
    chai.expect(typeof proj).to.equal('undefined');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal('The Project [name] is not of type String');
    done();
  });
}

function updateProject(done) {
  ProjController.updateProject(allSeeingUser, org.id, 'prtlgn', { id: 'prtlgn', name: 'portal gun changed' })
  .then((proj) => {
    chai.expect(proj.name).to.equal('portal gun changed');
    done();
  })
  .catch((error) => {
    const err = JSON.parse(error.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

function updateProjectObject(done) {
  ProjController.findProject(allSeeingUser, org.id, 'prtlgn')
  .then((projectFound) => {
    projectFound.name = 'portal gun changed again';
    ProjController.updateProject(allSeeingUser, org.id, 'prtlgn', projectFound)
    .then((projectUpdated) => {
      chai.expect(projectUpdated.name).to.equal('portal gun changed again');
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal(null);
      done();
    });
  })
  .catch((error2) => {
    const err = JSON.parse(error2.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests creating a second project
 */
function createProject02(done) {
  const projData = {
    id: 'dimc137rick',
    name: 'Mad Scientist',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    project = proj;
    chai.expect(proj.id).to.equal('dimc137rick');
    chai.expect(proj.name).to.equal('Mad Scientist');
    done();
  })
  .catch((err) => {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
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
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Save failed.');
    done();
  });
}

/**
 * Tests to see what valid name of the project
 * can be. how long till it breaks...
 * This succeeds...
 */
function createLongName(done) {
  const projData = {
    id: 'vlongname',
    name: 'This is Leah I am writing to see if this is valid are you from here on i am adding more because it worked with what i had at you',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('vlongname');
    done();
  })
  .catch((err) => {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Tests to see what valid length of the name
 * of project can be. how long till it breaks...
 * Just kidding this works......
 */
function createLongName02(done) {
  const projData = {
    id: 'vlongnametwo',
    name: 'This is Leah I am writing to see if this is valid are you from here on i am adding more because it worked with what i had at you i want to see you break because this is gettting really long and I want you to break please break I want to see you break',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('vlongnametwo');
    done();
  })
  .catch((err) => {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Tests to see what valid name of the project
 * can be.
 */
function createPeriodName(done) {
  const projData = {
    id: 'period',
    name: 'This is just to see if a period works....',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Project name is not valid.');
    done();
  });
}

/**
 * Tests attempting to create a project already existing
 */
function recreateProject(done) {
  const projData = {
    id: 'dimc137rick',
    name: 'Newbie',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then(() => {
    // error should occur therefore not hit then
    // failure if does
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Project already exists.');
    done();
  });
}

/**
 * Tests creating a project that has not id input.
 * This should be rejected and give an error.
 */
function noId(done) {
  const projData = {
    id: '',
    name: 'denyme',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((error) => {
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Project ID is not valid.');
    done();
  });
}

/**
 * Tests creating a project that has not id input.
 * This should be rejected and give an error.
 */
function noName(done) {
  const projData = {
    id: 'imfake',
    name: '',
    org: {
      id: 'council'
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((error) => {
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Project name is not valid.');
    done();
  });
}

/**
 * Tests creating a project that has not id input.
 * This should be rejected and give an error.
 */
function noOrg(done) {
  const projData = {
    id: 'imfake',
    name: 'denyme',
    org: {
      id: ''
    }
  };
  ProjController.createProject(allSeeingUser, projData)
  .then((error) => {
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Org not found.');
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
      id: 'council'
    }
  };
  ProjController.createProject(nonAuser, projData)
  .then(function(error) {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not have permissions.');
    done();
  });
}


/**
 * Tests for finding the project that was
 * just created above. Should succeed
 */

function findProj(done) {
  const orgId = 'council';
  const projId = 'prtlgn';
  ProjController.findProject(allSeeingUser, orgId, projId)
  .then(function(proj) {
    chai.expect(proj.id).to.equal('prtlgn');
    chai.expect(proj.name).to.equal('portal gun changed again');
    done();
  })
  .catch(function(err) {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Tests for find a project that does not exist.
 * Should output error.
 */

function noProj(done) {
  const orgId = 'council';
  const projId = 'fakeProj';
  ProjController.findProject(allSeeingUser, orgId, projId)
  .then(function(error) {
    // chai.expect(error).to.not.equal(null);
    chai.expect(error).to.equal('Project not found');
    done();
  })
  .catch(function(err) {
    // chai.expect(error).to.not.equal(null);
    chai.expect(JSON.parse(err.message).description).to.equal('Project not found.');
    done();
  });
}

/**
 * Tests for find a project using a non admin user.
 * Should output error.
 */

function nonAUser(done) {
  const orgId = 'council';
  const projId = 'prtlgn';
  ProjController.findProject(nonAuser, orgId, projId)
  .then(function(error) {
    chai.assert(true === false);
    done();
  })
  .catch(function(err) {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Tests for updating a project.
 * Should pass.
 */

function updateProj(done) {
  const orgId = 'council';
  const projId = 'prtlgn';
  const updateData = {
    name: 'freeze ray'
  };
  ProjController.updateProject(allSeeingUser, orgId, projId, updateData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('prtlgn');
    chai.expect(proj.name).to.equal('freeze ray');
    done();
  })
  .catch((err) => {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Tests for updating the projects id name.
 * This should get denied.
 */

function updateID(done) {
  const orgId = 'council';
  const projId = 'prtlgn';
  const updateData = {
    id: 'freezeray'
  };
  ProjController.updateProject(allSeeingUser, orgId, projId, updateData)
  .then((proj) => {
    chai.expect(proj.id).to.equal('freezeray');
    done();
  })
  .catch((err) => {
    const json = JSON.parse(err.message);
    chai.expect(json.description).to.equal('Users cannot update [id] of Projects.');
    done();
  });
}

/**
 * Tests for updating a project with a non admin user.
 * Should throw an error.
 */

function updateNonA(done) {
  const orgId = 'council';
  const projId = 'dimc137rick';
  const updateData = {
    name: 'Still Mad'
  };
  ProjController.updateProject(nonAuser, orgId, projId, updateData)
  .then(() => {
    // should never come in then
    // should throw error incase
    chai.assert(true === false);
    done();
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('User does not have permission.');
    done();
  });
}

/**
 * Tests finding all permisions on the project.
 */
function findPerm(done) {
  ProjController.findPermissions(allSeeingUser, org.id, 'prtlgn', allSeeingUser)
  .then((perm) => {
    chai.expect(perm.read).to.equal(true);
    chai.expect(perm.write).to.equal(true);
    chai.expect(perm.admin).to.equal(true);
    done();
  })
  .catch((err2) => {
    const json = JSON.parse(err2.message);
    chai.expect(json.description).to.equal(null);
    done();
  });
}

/**
 * Tests setting permissions on the project where you need
 * permission to acces the org so you need to set those
 * permissions before setting the project permissions.
 */
function setPerm(done) {
  OrgController.setPermissions(allSeeingUser, 'council', nonAuser, 'write')
  .then(() => {
    ProjController.setPermissions(allSeeingUser, 'council', project.id.toString(), nonAuser, 'write')
    .then(() => {
      ProjController.findProject(allSeeingUser, 'council', project.id.toString())
      .then((retProj) => {
        chai.expect(retProj.permissions.write[1]._id.toString()).to.equal(nonAuser._id.toString());
        chai.expect(retProj.permissions.read[1]._id.toString()).to.equal(nonAuser._id.toString());
        chai.expect(retProj.permissions.admin.length).to.equal(1);
        done();
      })
      .catch((err) => {
        const json = JSON.parse(err.message);
        chai.expect(json.description).to.equal(null);
        done();
      });
    })
    .catch((err2) => {
      const json2 = JSON.parse(err2.message);
      chai.expect(json2.description).to.equal(null);
      done();
    });
  })
  .catch((error) => {
    const json3 = JSON.parse(error.message);
    chai.expect(json3.description).to.equal(null);
    done();
  });
}

/**
 * Tests soft-deleting a project
 */
function softDeleteProject(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'prtlgn', { soft: true })
  .then((proj) => {
    ProjController.findProject(allSeeingUser, org.id, 'prtlgn')
    .then((proj2) => {
      chai.expect(proj2).to.equal(null);
      done();
    })
    .catch((error) => {
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Project not found.');
      done();
    });
  })
  .catch((error2) => {
    const err = JSON.parse(error2.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests deleting a project
 */
function deleteProject(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'prtlgn', { soft: false })
  .then((proj) => {
    ProjController.findProject(allSeeingUser, org.id, 'prtlgn')
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
      const err = JSON.parse(error.message);
      chai.expect(err.description).to.equal('Project not found.');
      done();
    });
  })
  .catch((error3) => {
    const err = JSON.parse(error3.message);
    chai.expect(err.description).to.equal(null);
    done();
  });
}

/**
 * Tests deleting second project
 */
function deleteProject02(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'dimc137rick', { soft: false })
  .then((proj) => {
    ProjController.findProject(allSeeingUser, org.id, 'dimc137rick')
    .then((proj2) => {
      chai.expect(proj2).to.equal(null);
      done();
    })
    .catch((err2) => {
      chai.expect(JSON.parse(err2.message).description).to.equal('Project not found.');
      done();
    });
  })
  .catch((err) => {
    chai.expect(JSON.parse(err.message).description).to.equal('Project not found');
    done();
  });
}

/**
 * Tests deleting all the other projects created
 */
function deleteOthers(done) {
  ProjController.removeProject(allSeeingUser, org.id, 'vlongname', { soft: false })
  .then(() => {
    ProjController.findProject(allSeeingUser, org.id, 'vlongname')
    .then((proj) => {
      chai.expect(proj).to.equal(null);
      done();
    })
    .catch((error) => {
      chai.expect(JSON.parse(error.message).description).to.equal('Project not found.');
      ProjController.removeProject(allSeeingUser, org.id, 'vlongnametwo', { soft: false })
      .then(() => {
        ProjController.findProject(allSeeingUser, org.id, 'vlongnametwo')
        .then((proj2) => {
          chai.expect(proj2).to.equal(null);
          done();
        })
        .catch((err2) => {
          chai.expect(JSON.parse(err2.message).description).to.equal('Project not found.');
          done();
        });
      })
      .catch((err) => {
        chai.expect(err).to.equal(null);
        done();
      });
    });
  });
}
