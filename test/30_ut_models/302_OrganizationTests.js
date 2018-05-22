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
 * @module  Org Model Tests
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  Tests the org model
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/OrganizationModel');


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

  it('should create an organization', createOrg).timeout(2500);
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
    id: 'empire',
    name: 'Galactic Empire'
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
 * Deletes the organization.
 */
function deleteOrg(done) {
  Org.findOneAndRemove({
    id: 'empire'
  }, (err) => {
    chai.expect(err).to.equal(null);
    done();
  });
}
