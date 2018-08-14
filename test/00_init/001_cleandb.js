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
 * @module  test/001_CleanDB
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description  Intial test to clean the database before other tests
 */

const path = require('path');
const chai = require('chai');
const mongoose = require('mongoose');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const User = M.require('models.User');
const Organization = M.require('models.Organization');
const Project = M.require('models.Project');
const Elem = M.require('models.Element');

const db = M.require('lib.db');

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
  /*-------------------------------------
   * Before: runs before all tests
   *-------------------------------------*/
  before(() => {
    // Open the database connection
    db.connect();
  });

  /*-------------------------------------
   * After: runs after all tests
   *-------------------------------------*/
  after(() => {
    // Close database connection
    mongoose.connection.close();
  });


  it('clean database', checkDB).timeout(5000);
});

function checkDB(done) {
  User.remove({}, (error) => {
    chai.expect(error).to.equal(null);
    Organization.remove({}, (error2) => {
      chai.expect(error2).to.equal(null);
      Project.remove({}, (error3) => {
        chai.expect(error3).to.equal(null);
        Elem.Element.remove({}, (error4) => {
          chai.expect(error4).to.equal(null);
          done();
        });
      });
    });
  });
}
