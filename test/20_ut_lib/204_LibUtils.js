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
 * @module  test/202_LibUtils
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This file tests the utility functions.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require('../../mbee.js');
const utils = M.load('lib/utils');

const samepleObj = {
  project: {
    id: 'myID',
    name: 'The Name',
    org: {
      id: 'myOrgID'
    }
  },
  type: 'Element'
};


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  it('should check that a string is a string and succeed', stringIsString);
  it('should check that a number is a string and fail', numberIsString);
  it('should check that an object is an object and succeed', objectIsObject);
  it('should check that the key project.id exists and succeed', projectIDExists);
  it('should check that the key project.user exists and fail', projectUserExists);
  it('should check that multiple keys exists and succeed', multipleExist);
  it('should check that a user is an admin which they are', userIsAdmin);
  it('should check that a user is an admin which they are not', userIsNotAdmin);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * @description  Checks that a string is a string.
 */
function stringIsString(done) {
  try {
    utils.checkType(['hello', 'goodbye'], 'string');
    done();
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
}

/**
 * @description  Checks that a number is a string.
 */
function numberIsString(done) {
  try {
    utils.checkType([1, 2], 'string');
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
    done();
  }
}

/**
 * @description  Checks that an object is an object.
 */
function objectIsObject(done) {
  try {
    utils.checkType([{ hello: 'string' }], 'object');
    done();
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
}

/**
 * @description  Checks that the key project.id exists.
 */
function projectIDExists(done) {
  try {
    utils.checkExists(['project.id'], samepleObj);
    done();
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
}

/**
 * @description  Checks that the key project.user exists.
 */
function projectUserExists(done) {
  try {
    utils.checkExists(['project.user'], samepleObj);
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
    done();
  }
}

/**
 * @description  Checks that multiple keys exist.
 */
function multipleExist(done) {
  try {
    utils.checkExists(['project.id', 'project.name', 'project.org.id', 'type'], samepleObj);
    done();
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
}

/**
 * @description  Check that a user is an admin and succeed.
 */
function userIsAdmin(done) {
  const user = { name: 'Darth Vader', admin: true };
  try {
    utils.checkAdmin(user);
    done();
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
}

/**
 * @description  Check that a user is an admin and fail.
 */
function userIsNotAdmin(done) {
  const user = { name: 'Stormtrooper 123', admin: false };
  try {
    utils.checkAdmin(user);
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.status).to.equal(401);
    done();
  }
}
