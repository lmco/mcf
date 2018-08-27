/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.302-org-model-tests
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
 * @description Tests the organization model by performing various actions
 * such as a create, soft delete, and hard delete. The test Does NOT test the
 * organization controller but instead directly manipulates data using the
 * database interface to check the organization model's methods, validators,
 * setters, and getters.
 */

// Load node modules
const chai = require('chai');

// Load MBEE modules
const Org = M.require('models.organization');
const db = M.require('lib.db');
const AuthController = M.require('lib.auth');
const User = M.require('models.user');
const mockExpress = M.require('lib.mock-express');

// Variables used across test functions
let userAdmin = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: runs before all tests. Open database connection and creates admin
   * user.
   */
  before((done) => {
    db.connect();
    const params = {};
    const body = {
      username: M.config.test.username,
      password: M.config.test.password
    };

    const reqObj = mockExpress.getReq(params, body);
    const resObj = mockExpress.getRes();

    AuthController.authenticate(reqObj, resObj, (err) => {
      chai.expect(err).to.equal(null);
      chai.expect(reqObj.user.username).to.equal(M.config.test.username);

      // TODO - consider using an .exec rather than callback to make this cleaner (MBX-373)
      User.findOneAndUpdate({ username: reqObj.user.username }, { admin: true },
        { new: true },
        (updateErr, userUpdate) => {
          chai.expect(updateErr).to.equal(null);
          chai.expect(userUpdate).to.not.equal(null);

          userAdmin = userUpdate;
          done();
        });
    });
  });

  /**
   * After: runs after all tests. Deletes admin user and close database
   * connection.
   */
  after((done) => {
    // Find user
    User.findOne({
      username: M.config.test.username
    }, (err, foundUser) => {
      chai.expect(err).to.equal(null);
      // Remove user
      foundUser.remove((err2) => {
        chai.expect(err2).to.equal(null);

        // Disconnect from database
        db.disconnect();
        done();
      });
    });
  });

  /* Execute the tests */
  it('should create an organization', createOrg);
  it('should find an organization', findOrg);
  it('should update an organization', updateOrg);
  it('should get all permissions of an organization', findOrgPermissions);
  it('should soft delete an organization', softDeleteOrg);
  it('should hard delete an organization', deleteOrg);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Creates an organization using the Organization model.
 */
function createOrg(done) {
  // Create an organization from the Organization model object
  const org = new Org({
    id: 'avengers',
    name: 'Avengers Initiative',
    permissions: {
      admin: [userAdmin._id],
      write: [userAdmin._id],
      read: [userAdmin._id]
    }
  });
  // Save the Organization model object to the database
  org.save((err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}

/**
 * @description Finds an organization using the Organization Model
 */
function findOrg(done) {
  // Find the created organization from the previous createOrg() test
  Org.findOne({
    id: 'avengers',
    name: 'Avengers Initiative'
  }, (err, retOrg) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Verify correct org is returned
    chai.expect(retOrg.id).to.equal('avengers');
    chai.expect(retOrg.name).to.equal('Avengers Initiative');

    done();
  });
}

/**
 * @description Updates an organization using the Organization Model
 */
function updateOrg(done) {
  // Find and update the org created in the previous createOrg() test
  Org.findOneAndUpdate({
    id: 'avengers'
  }, {
    name: 'Avengers'
  }, (err, org) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Find the updated org
    Org.findOne({
      id: org.id
    }, (err2, retOrg) => {
      // Expect no error
      chai.expect(err2).to.equal(null);

      // Verify org is updated correctly
      chai.expect(retOrg.id).to.equal('avengers');
      chai.expect(retOrg.name).to.equal('Avengers');
      done();
    });
  });
}

/**
 * @description Finds permissions an organization using the Organization Model.
 */
function findOrgPermissions(done) {
  // Finds permissions on the org created in the previous createOrg() test
  Org.findOne({
    id: 'avengers'
  }, (err, retOrg) => {
    // Expect no error
    chai.expect(err).to.equal(null);

    // Confirming user permissions are in organization
    chai.expect(retOrg.permissions.write[0].toString()).to.equal(userAdmin._id.toString());
    done();
  });
}

/**
 * @description Soft-deletes the organization previously created in createOrg.
 */
function softDeleteOrg(done) {
  // TODO: remove LM specific comments in public (MBX-370)
  // LM: Changed from findOneAndUpdate to a find and then update
  // findOneAndUpdate does not call setters, and was causing strange
  // behavior with the deleted and deletedOn fields.
  // https://stackoverflow.com/questions/18837173/mongoose-setters-only-get-called-when-create-a-new-doc

  // Find the previously created organization from createOrg.
  Org.findOne({ id: 'avengers' })
  .exec((err, org) => {
    // Set the deleted field of the organization to true
    org.deleted = true;
    // Save the updated organization object to the database
    org.save((saveErr) => {
      // Find the previously updated organization
      Org.findOne({
        id: org.id
      }, (err2, org2) => {
        // Verify the organization has been soft deleted.
        chai.expect(err2).to.equal(null);
        chai.expect(org2.deletedOn).to.not.equal(null);
        chai.expect(org2.deleted).to.equal(true);
        done();
      });
    });
  });
}

/**
 * @description hard deletes the previously created organization from createOrg.
 */
function deleteOrg(done) {
  // find and remove the organization
  Org.findOneAndRemove({
    id: 'avengers'
  }, (err) => {
    // Check that the remove action did not fail.
    chai.expect(err).to.equal(null);
    done();
  });
}
