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
 * @module  Lib Tests
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 @description  This is currently a test of loading the Crypto Library and seeing if encrypt and
 decrypt are defined in the code.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

/*------------------------------------
 *       Main
 *------------------------------------
 */

describe(name, () => {
  it('should create an error with no status code', noStatusCode);
  it('should create a error with a 400 status code', status400);
  it('should log a critical error', critical);
});


/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * @description  Creates an error with no status code
 */
function noStatusCode(done) {
  const err = new CustomError('Database save failed.');
  chai.expect(err.status).to.equal(500);
  chai.expect(err.message).to.equal('Internal Server Error');
  chai.expect(err.description).to.equal('Database save failed.');
  done();
}


/**
 * @description  Creates an error with no 400 code
 */
function status400(done) {
  const err = new CustomError('Project id not provided.', 400);
  chai.expect(err.status).to.equal(400);
  chai.expect(err.message).to.equal('Bad Request');
  chai.expect(err.description).to.equal('Project id not provided.');
  done();
}

/**
 * @description  Logs a critical error
 */
function critical(done) {
  const err = new CustomError('I need some coffee.', 418, 'critical');
  console.log(err);
  chai.expect(err.status).to.equal(418);
  chai.expect(err.message).to.equal('I\'m a teapot');
  chai.expect(err.description).to.equal('I need some coffee.');
  done();
}
