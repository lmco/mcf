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
 * @module  test/203-lib-error
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This file tests basic CustomError functionality.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require('../../mbee.js');
const errors = M.require('lib/errors');

/******************************************************************************
 *  Main                                                                      *
 ******************************************************************************/

describe(name, () => {
  it('should create an error with no status code', noStatusCode);
  it('should create a error with a 400 status code', status400);
});


/******************************************************************************
 *  Test Functions                                                            *
 ******************************************************************************/

/**
 * @description  Creates an error with no status code
 */
function noStatusCode(done) {
  const err = new errors.CustomError('Database save failed.');
  chai.expect(err.status).to.equal(500);
  chai.expect(err.message).to.equal('Internal Server Error');
  chai.expect(err.description).to.equal('Database save failed.');
  done();
}


/**
 * @description  Creates an error with no 400 code
 */
function status400(done) {
  const err = new errors.CustomError('Project id not provided.', 400);
  err.log();
  chai.expect(err.status).to.equal(400);
  chai.expect(err.message).to.equal('Bad Request');
  chai.expect(err.description).to.equal('Project id not provided.');
  done();
}
