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
 * @fileOverview UserModelTests
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This class defines basic tests of the User data model.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const User = M.load('models/User');


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  // runs before all tests in this block
  before(() => {
    const db = M.load('lib/db');
    db.connect();
  });

  // runs after all tests in this block
  after(() => {
    mongoose.connection.close();
  });

  it('should create a user', createUser).timeout(5000);
  it('should verify a valid password', verifyValidPassword).timeout(5000);
  it('shouldnt verify an invalid password', verifyInvalidPassword).timeout(5000);
  it('should get a user from the database', getUser);
  it('should update a user', updateUser);
  it('should soft delete a user', softDeleteUser).timeout(5000);
  it('should get a soft deleted user', getSoftDeletedUser);
  it('should delete a user', deleteUser);
  it('should login an LDAP user', loginLDAPUser).timeout(10000);
});
