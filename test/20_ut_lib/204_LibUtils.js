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
  it('should create a valid uid', validUID);
  it('should try to create a uid from invalid parameters and fail', invalidUID);
  it('should parse a valid uid', parseValidUID);
  it('should try to parse an invalid uid and fail', parseInvalidUID);
  it('should parse a valid uid and get the second element', parseValidUIDSecondElement);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Checks that a string is a string.
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
 * Checks that a number is a string.
 */
function numberIsString(done) {
  try {
    utils.assertType([1, 2], 'string');
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
 * Checks that an object is an object.
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
 * Checks that the key project.id exists.
 */
function projectIDExists(done) {
  try {
    utils.assertExists(['project.id'], sampleObj);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
  chai.expect(utils.checkExists(['project.id'], sampleObj)).to.equal(true);
  done();
}

/**
 * Checks that the key project.user exists.
 */
function projectUserExists(done) {
  try {
    utils.assertExists(['project.user'], sampleObj);
    chai.expect(true).to.equal(false);
    done();
  }
  catch (error) {
    chai.expect(error.status).to.equal(400);
  }
  chai.expect(utils.checkExists(['project.user'], sampleObj)).to.equal(false);
  done();
}

/**
 * Checks that multiple keys exist.
 */
function multipleExist(done) {
  try {
    utils.assertExists(['project.id', 'project.name', 'project.org.id', 'type'], sampleObj);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
  chai.expect(utils.checkExists(['project.name', 'project.org.id'], sampleObj)).to.equal(true);
  done();
}

/**
 * Check that a user is an admin and succeed.
 */
function userIsAdmin(done) {
  const user = { name: 'Darth Vader', admin: true };
  try {
    utils.assertAdmin(user);
  }
  catch (error) {
    chai.expect(error.message).to.equal(null);
    done();
  }
  chai.expect(utils.checkAdmin(user)).to.equal(true);
  done();
}

/**
 * Check that a user is an admin and fail.
 */
function userIsNotAdmin(done) {
  const user = { name: 'Stormtrooper 123', admin: false };
  try {
    utils.assertAdmin(user);
    chai.expect(true).to.equal(false);
    done();
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
