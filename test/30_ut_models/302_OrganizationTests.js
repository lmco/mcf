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
 * @module test/302_OrganizationModel
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This tests the Organization Model functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The organization model tests create,
 * soft deletes, and hard deletes organizations.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/Organization');


/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  /*-------------------------------------
   * Before: runs before all tests
   *-------------------------------------*/
  before(() => {
    // Open database conection
    const db = M.load('lib/db');
    db.connect();
  });

  /*-------------------------------------
   * After: runs after all tests
   *-------------------------------------*/
  after(() => {
    // Close database connection
    mongoose.connection.close();
  });

  /*----------
   * Tests
   *----------*/
  it('should create an organization', createOrg).timeout(2500);
  it('should soft delete an organization', softDeleteOrg).timeout(2500);
  it('should delete an organization', deleteOrg).timeout(2500);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Creates a user using the User model.
 */
function createOrg(done) {
  const org = new Org({
    id: 'avengers',
    name: 'Infinity Stone'
  });
  org.save((err) => {
    if (err) {
      M.log.error(err);
    }
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * Soft-deletes the org.
 */
function softDeleteOrg(done) {
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc
  Org.findOne({ id: 'avengers' })
  .exec((err, org) => {
    org.deleted = true;
    org.save((saveErr) => {
      Org.findOne({
        id: org.id
      }, (err2, org2) => {
        // Verify soft delete
        chai.expect(err2).to.equal(null);
        chai.expect(org2.deletedOn).to.not.equal(null);
        chai.expect(org2.deleted).to.equal(true);
        done();
      });
    });
  });
}

/**
 * Deletes the organization.
 */
function deleteOrg(done) {
  Org.findOneAndRemove({
    id: 'avengers'
  }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
