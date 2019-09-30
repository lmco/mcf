/**
 * @classification UNCLASSIFIED
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
// NPM modules
import React from 'react';
import mount from './../mount.js';
// import { MemoryRouter } from 'react-router-dom';
import { shallow } from 'enzyme';
import chai from 'chai';

// MBEE components
import List from '../../../app/ui/components/general/list/list.jsx';
import ListItem from '../../../app/ui/components/general/list/list-item.jsx';
import KeyData from '../../../app/ui/components/general/custom-data/key-data.jsx';
import Divider from '../../../app/ui/components/general/sidebar/divider.jsx';
import SidebarHeader from '../../../app/ui/components/general/sidebar/sidebar-header.jsx';

/* eslint-enable no-unused-vars */

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */

describe(M.getModuleName(module.filename), () => {
  // const originalLocation = window.location;
  //
  // beforeEach(() => {
  //   delete window.location;
  //
  //   window.location = {
  //     href: '',
  //   };
  // });
  //
  // afterEach(() => {
  //   window.location = originalLocation;
  // });

  // it('Renders the list component', listRender);
  // it('Renders the list item component', listItemRender);
  it('Renders the key data component', keyDataRender);
  it('Renders the divider component', dividerRender);
  it('Renders the sidebar header component', sidebarHeaderRender);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Mount the list component to verify
 * component renders correctly.
 */
// function listRender(done) {
//   // Render list component
//   const wrapper = mount(
//     <List>
//      <ListItem />
//     </List>
//   );
//   wrapper.debug();
//   console.log(wrapper.debug());
//   // Expect component to be in DOM
//   chai.expect(wrapper.exists()).to.equal(true);
//   done();
// }

/**
 * @description Mount the list item component to verify
 * component renders correctly.
 */
// async function listItemRender(done) {
//   // Render list item component
//   const wrapper = mount(
//     <ListItem />
//   );
//   console.log('it was here actually')
//   console.log(wrapper.debug());
//   // Expect component to be in DOM
//   chai.expect(wrapper.exists()).to.equal(true);
//   done();
// }

/**
 * @description Mount the key data component to verify
 * component renders correctly.
 */
function keyDataRender(done) {
  // Render key data component
  const wrapper = shallow(
    <KeyData />
  );
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
  done();
}

/**
 * @description Mount the divider component to verify
 * component renders correctly.
 */
function dividerRender(done) {
  // Render key data component
  const wrapper = shallow(
    <Divider />
  );
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
  done();
}

/**
 * @description Mount the sidebar header component to
 * verify component renders correctly.
 */
function sidebarHeaderRender(done) {
  // Render sidebar header component
  const wrapper = shallow(
    <SidebarHeader />
  );
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
  done();
}
