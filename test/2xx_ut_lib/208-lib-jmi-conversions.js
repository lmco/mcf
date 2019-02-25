/**
 * Classification: UNCLASSIFIED
 *
 * @module test.201-lib-crypto
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description Tests loading the MBEE crypto library and executing the encrypt
 * and decrypt functions in the library.
 */

// Node modules
const chai = require('chai');
const convertJMI= M.require('lib.jmi-conversions');

describe(M.getModuleName(module.filename), () => {
  it('should check JMI conversion', checkJMI);
});

function checkJMI(done) {
  const data = [{ 'id': "1", "parent": null}, {"id": "2", "parent": null}, { 'id': "3", "parent": "1"}, { 'id': "4", "parent": "2"},
    { 'id': "5", "parent": "4"}];

  const object = convertJMI.convertJMI(1, 3, data, 'id');

  console.log(JSON.stringify(object, null, M.config.server.api.json.indent));

  done();
}
