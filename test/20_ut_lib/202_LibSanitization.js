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
@description  This is currently a test to see if encrypt returns a hex.
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

const M = require('../../mbee.js');

/*------------------------------------
 *       Main
 *------------------------------------
 */

describe(name, () => {
  it('should output empty object', sanTest);
});

describe(name, () => {
  it('should not sanitize strings', htmlMongoTest);
});

describe(name, () => {
  it('should delete the key by user input', keyDelete);
});

describe(name, () => {
  it('should sanitize html inputs by user', htmlTest);
});

/*------------------------------------
 *       Test Functions
 *------------------------------------*/

/**
 * Loads a library
 */


function sanTest(done) {
  const sanitization = M.load('lib/sanitization');
  const mongoSan = sanitization.mongo({ $lt: 10 });
  chai.expect(typeof mongoSan).to.equal(typeof {});
  done();
}

/* This html test if failing due to mongo sanitize not being able to
take in strings because mongo sanitize only takes in objects */
function htmlMongoTest(done) {
  const sanitization = M.load('lib/sanitization');
  const mongohtmlSan = sanitization.mongo({ '$<script>': null });
  chai.expect(mongohtmlSan).to.not.equal({});
  done();
}

/* This key delete is failing not being able to compare to the key */
function keyDelete(done) {
  const v = { $lt: null };
  const sanitization = M.load('lib/sanitization');
  const mongoSanitize = sanitization.mongo(v);
  const key = Object.keys(mongoSanitize);
  chai.expect(key.length).to.equal(0);
  done();
}

function htmlTest(done) {
  const sanitization = M.load('lib/sanitization');
  const htmlSan = sanitization.html('<script>');
  chai.expect(htmlSan).to.equal('&lt;script&gt;');
  done();
}
