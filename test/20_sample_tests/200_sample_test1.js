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
 * @module  Framework Tests
 *
 * @description  <TEST SUITE DESCRIPTION
 */

const chai = require('chai');
const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];

var val1 = 6;
var val2 = 4;
var val3 = 10;
var arr1 = [1, 2, 3, 4, 5];
function func1(){
    return("func1 returning correctly");
}


describe(name, () => {
    it('val1 and val2 should be numbers', numTest)
    it('val1 + val2 should equal val3', equalityTest);
    it('arr1 should not be empty or include the number 6', arrTest)
    it('func1 should return the correct value', funcTest)
});

function numTest(done){
    chai.expect(val1).to.be.a('number');
    chai.expect(val2).to.be.a('number');
    done();
}

function equalityTest(done){
    chai.expect(val1 + val2).to.equal(val3);
    done();
}

function arrTest(done){
    chai.expect(arr1).to.not.be.empty;
    chai.expect(arr1).to.not.include.members([6])
    done();
}

function funcTest(done){
    chai.expect(func1()).to.equal("func1 returning correctly");
    done();
}
