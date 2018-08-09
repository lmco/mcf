/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/302-org-model-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author  Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This tests the Organization Model functionality. These tests
 * are to make sure the code is working as it should or should not be. Especially,
 * when making changes/ updates to the code. The organization model tests create,
 * soft deletes, and hard deletes organizations.
 */

// Load node modules
const chai = require('chai');
const mongoose = require('mongoose'); // TODO - remove the need for mongoose

// Load mbee modules
const Org = M.require('models.Organization');


/* --------------------( Main )-------------------- */


describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Open database connection.
   */
  before(() => {
    const db = M.require('lib.db');
    db.connect();
  });

  /**
   * After: runs after all tests. Close database connection.
   */
  after(() => {
    // TODO - we should write close function in the db.js module so tests don't
    // need to require mongoose
    mongoose.connection.close();
  });

  /* Execute the tests */
  it('should create an organization', createOrg);
  it('should soft delete an organization', softDeleteOrg);
  it('should delete an organization', deleteOrg);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Creates a user using the User model.
 */
function createOrg(done) {
  const org = new Org({
    id: 'avengers',
    name: 'Avengers Initiative'
  });
  org.save((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}


/**
 * @description Soft-deletes the org.
 *
 * TODO - add to description
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
 * @description Deletes the organization.
 */
function deleteOrg(done) {
  Org.findOneAndRemove({
    id: 'avengers'
  }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
