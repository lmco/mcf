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

const fs = require('fs');
const path = require('path');
const chai  = require('chai');
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require(__dirname + '/../../mbee.js');
const Org = M.load('models/OrganizationModel');


/*----------( Main )----------*/


describe(name, function() {
  // runs before all tests in this block
  before(function() {
    const db = M.load('lib/db');
    db.connect();
  });

  // runs after all tests in this block
  after(function() {
    mongoose.connection.close();
  });

  it('should create an organization', createOrg).timeout(2500);
  it('should delete an organization', deleteOrg).timeout(2500);
});


/*----------( Test Functions )----------*/


/**
 * Creates a user using the User model.
 */
function createOrg(done) {
  let org = new Org({
      id:   'empire',
      name: 'Galactic Empire'
  });
  org.save(function(err) {
    if (err) {
        console.log(err);
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
    id: 'empire',
  }, function(err) {
    chai.expect(err).to.equal(null);
    done();
  });
}


