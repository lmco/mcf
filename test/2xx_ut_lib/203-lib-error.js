/**
 * Classification: UNCLASSIFIED
 *
 * @module  test/203-lib-error
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
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description  This file tests basic CustomError functionality.
 */

// Load node modules
const chai = require('chai');

// Load mbee modules
const errors = M.require('lib.errors');


/* --------------------( Main )-------------------- */


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
