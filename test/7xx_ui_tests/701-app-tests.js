/**
 * Classification: UNCLASSIFIED
 *
 * @module test.700-general-component-mount-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests that the general component mount
 * and render.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require("jsdom");
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// Configure enzyme adaptor
configure({ adapter: new Adapter() });
const mbee = fs.readFileSync(path.join(M.root, 'app', 'ui', 'js', 'mbee.js'), { encoding: "utf-8" });


// NPM modules
import React from 'react';
import { shallow, mount } from 'enzyme';
import chai from 'chai';

// MBEE components
import Home from '../../app/ui/components/home-views/home.jsx';

/* eslint-enable no-unused-vars */

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */

describe(M.getModuleName(module.filename), () => {
  let window;
  beforeEach(() => {
    window = (new JSDOM('<!doctype html><body></body></html>', { runScripts: 'outside-only' })).window;
    var $ = require('jquery')(window);
    window.eval(`
      // This code executes in the jsdom global scope
      mbeeWhoAmI = typeof XMLHttpRequest === "function";
    `);

    // assert(window.mbeeWhoAmI === true);
    // var mbeeWhoAmI = require(path.join(M.root, 'app', 'ui', 'js', 'mbee.js'))(window);

    // Execute my library by inserting a <script> tag containing it.
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = mbee;
    window.document.body.appendChild(scriptEl);
    // console.log(window);
  });

  it('Renders the list component', homeRender);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Mount the list component to verify
 * component renders correctly.
 */
function homeRender(done) {
  // Render list component
  const wrapper = shallow(<Home />);
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
  done();
}
