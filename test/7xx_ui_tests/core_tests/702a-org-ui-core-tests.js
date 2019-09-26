/**
 * Classification: UNCLASSIFIED
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
import { MemoryRouter, Route } from 'react-router-dom';
import { shallow, mount } from 'enzyme';
import chai from 'chai';

const rrd = require('react-router-dom');
// Just render plain div with its children
rrd.BrowserRouter = ({children}) => <div>{children}</div>
module.exports = rrd;

// MBEE components
import OrgHome from '../../../app/ui/components/org-views/org-home.jsx';
import InformationPage from '../../../app/ui/components/shared-views/information-page.jsx';

/* eslint-enable no-unused-vars */

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  beforeEach(() => {
    window.document = {
      ...window.document,
      addEventListener: () => { },
      removeEventListener: () => { }
    };
    // window.sessionStorage['mbee-user'] = {
    //   admin: true,
    //   custom: {},
    //   email: "",
    //   fname: "",
    //   lname: "",
    //   preferredName: "",
    //   provider: "local",
    //   username: "admin"}
  });

  it('Renders the org home component', orgHomeRender);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Mount the list component to verify
 * component renders correctly.
 */
function orgHomeRender(done) {
  console.log('before');
  const wrapper = mount(
    <MemoryRouter initialEntries={[ '/', '/orgs/default' ]}>
      <Route path={'/orgs/:orgid'} render={(props) => (<OrgHome {...props}/>)} />
    </MemoryRouter>, { attachTo: document.getElementById('main') });
  console.log('after');
  console.log(wrapper.debug());

  // Expect component to be in DOM
  // chai.expect(wrapper.find(OrgHome).length).to.equal(1);
  chai.expect(wrapper.exists()).to.equal(true);
  done();
}
