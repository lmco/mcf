/**
 * Classification: UNCLASSIFIED
 *
 * @module test.208-lib-jmi-conversions
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Tests the conversion of the MBEE JMI type conversion functions in
 * the library.
 */

// Node modules
const chai = require('chai');
const path = require('path');

// MBEE Modules
const convertJMI = M.require('lib.jmi-conversions');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = require(path.join(M.root, 'test', 'test-utils'));
const testData = testUtils.importTestData('test_data.json');

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('should convert JMI type 1 to type 2', convert1to2);
  it('should convert JMI type 1 to type 3', convert1to3);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Checks JMI type 2 conversion.
 */
function convert1to2(done) {
  // Initialize test data
  const data = testData.jmi;

  // Convert JMI type from 1 to 2
  const object = convertJMI.convertJMI(1, 2, data, 'id');

  // Verify conversion with length of object
  chai.expect(Object.keys(object).length === 5);
  done();
}

/**
 * @description Checks JMI type 3 conversion.
 */
function convert1to3(done) {
  // Initialize test data
  const data = testData.jmi;

  // Convert JMI type from 1 to 3
  const object = convertJMI.convertJMI(1, 3, data, 'id');

  // Verify object data
  chai.expect(Object.keys(object).length === 2);
  chai.expect(Object.keys(object[testData.jmi[0].id].contains).length > 0);
  done();
}
