/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/000-init
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
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  This "test" is used to clean out the database before other
 * tests. It SHOULD NOT be run if testing against production databases. It
 * is intended for use in CI/CD testing to ensure the database is empty and
 * improve CI testing.
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const M = require(path.join(__dirname, '..', '..', 'mbee.js'));

const User = M.require('models.User');
const Organization = M.require('models.Organization');
const Project = M.require('models.Project');
const Element = M.require('models.Element');
const UserController = M.require('controllers.UserController');
const db = M.require('lib.db');


/* --------------------( Main )-------------------- */


/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), function() {
  /* Runs before all tests . Opens the database connection. */
  before(() => db.connect());

  /* Runs after all tests. Close database connection. */
  after(() => mongoose.connection.close());

  /* Execute the tests */
  it('clean database', cleanDB);
  it('should create the default org if it doesnt exist', createDefaultOrg);
});


/* --------------------( Tests )-------------------- */


/**
 * @description Cleans out the database by removing all items from all MongoDB
 * collections.
 */
function cleanDB(done) {
  User.remove({}).exec()  // Remove users
  // Remove all orgs except for the 'default' org.
  .then(() => Organization.remove({ name: { $ne: 'default' } }).exec())  // Remove orgs
  .then(() => Project.remove({}).exec())  // Remove projects
  .then(() => Element.Element.remove({}).exec())  // Remove elements
  .then(() => done())
  .catch(error => {
    chai.expect(error).to.equal(null);
    done();
  });
}


/**
 * @description Creates the default org if it doesn't already exist
 */
function createDefaultOrg(done) {
  Organization.findOne({ id: 'default' })
  .exec((err, org) => {
    chai.expect(err).to.equal(null);
    if (org === null) {
      const defOrg = new Organization({
        id: 'default',
        name: 'default'
      });
      defOrg.save((saveErr) => {
        chai.expect(saveErr).to.equal(null);
        done();
      });
    }
    else {
      // Prune current users to ensure no deleted
      // users are still part of the org
      UserController.findUsers()
      .then((users) => {
        let newList = [];

        // Add all existing users to the read list
        Object.keys(users).forEach((user) => {
          newList.push(users[user]._id);
        });
        org.permissions.read = newList;

        // Save the updated org
        org.save((saveOrgErr) => {
          chai.expect(saveOrgErr).to.equal(null);
          done();
        });
      })
      .catch((err) => {
        chai.expect(err).to.equal(null);
        done();
      });
    }
  });
}
