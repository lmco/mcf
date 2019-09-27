/**
 * @classification UNCLASSIFIED
 *
 * @module test.7xx_ui_tests.701-app-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This tests the app of the home to
 * verify the render works correctly.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
// NPM modules
import React from 'react';
import { mount } from 'enzyme';
import chai from 'chai';

// MBEE components
import Home from '../../../app/ui/components/home-views/home.jsx';

/* eslint-enable no-unused-vars */

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  it('Renders the home component', homeRender);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Mount the list component to verify
 * component renders correctly.
 */
function homeRender(done) {
  // Render home component
  const wrapper = mount(<Home />, { attachTo: document.getElementById('main') });
  // Expect component to be in DOM
  chai.expect(wrapper.find(Home).length).to.equal(1);
  done();
}
