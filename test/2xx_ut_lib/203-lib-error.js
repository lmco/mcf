/******************************************************************************
 * Classification: UNCLASSIFIED                                               *
 *                                                                            *
 * Copyright (C) 2018, Lockheed Martin Corporation                            *
 *                                                                            *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.        *
 * It is not approved for public release or redistribution.                   *
 *                                                                            *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export  *
 * control laws. Contact legal and export compliance prior to distribution.   *
 ******************************************************************************/
/**
 * @module  test/203-lib-error
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This file tests basic CustomError functionality.
 */

const chai = require('chai');
const M = require('../../mbee.js');
const errors = M.require('lib/errors');


/* --------------------( Main )-------------------- */


/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('should create an error with no status code', noStatusCode);
  it('should create a error with a 400 status code', status400);
});


/* --------------------( Tests )-------------------- */


/**
 * @description  Creates an error with no status code and verifies the
 * properties on the CustomError object.
 */
function noStatusCode(done) {
  const err = new errors.CustomError('Database save failed.');
  chai.expect(err.status).to.equal(500);
  chai.expect(err.message).to.equal('Internal Server Error');
  chai.expect(err.description).to.equal('Database save failed.');
  done();
}


/**
 * @description  Creates an error with a 400 code and verifies the expected
 * properties on the CustomError object.
 */
function status400(done) {
  const err = new errors.CustomError('Project id not provided.', 400);
  err.log();
  chai.expect(err.status).to.equal(400);
  chai.expect(err.message).to.equal('Bad Request');
  chai.expect(err.description).to.equal('Project id not provided.');
  done();
}
