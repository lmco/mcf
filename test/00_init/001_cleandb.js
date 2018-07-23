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
 * @description  Intial test to clean the database before starting
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

  it('do nothing', donothing).timeout(5000);
});

function donothing(){
}
