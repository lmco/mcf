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

// NPM modules
import React from 'react';
import { shallow, mount } from 'enzyme';
import chai from 'chai';

// MBEE components
import List from '../../app/ui/components/general/list/list.jsx';
import ListItem from '../../app/ui/components/general/list/list-item.jsx';
import CustomData from '../../app/ui/components/general/custom-data/custom-data.jsx';
import KeyData from '../../app/ui/components/general/custom-data/key-data.jsx';
import Divider from '../../app/ui/components/general/sidebar/divider.jsx';
import SidebarHeader from '../../app/ui/components/general/sidebar/sidebar-header.jsx';

/* eslint-enable no-unused-vars */

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */

describe(M.getModuleName(module.filename), () => {
  it('Renders the list component', listRender);
  it('Renders the list item component', listItemRender);
  it('Renders the key data component', keyDataRender);
  it('Renders the divider component', dividerRender);
  it('Renders the sidebar header component', sidebarHeaderRender);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Mount the list component to verify
 * component renders correctly.
 */
async function listRender() {
  // Render list component
  const wrapper = shallow(<List />);
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
}

/**
 * @description Mount the list item component to verify
 * component renders correctly.
 */
async function listItemRender() {
  // Render list item component
  const wrapper = shallow(<ListItem />);
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
}

/**
 * @description Mount the key data component to verify
 * component renders correctly.
 */
async function keyDataRender() {
  // Render key data component
  const wrapper = shallow(<KeyData />);
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
}

/**
 * @description Mount the divider component to verify
 * component renders correctly.
 */
async function dividerRender() {
  // Render key data component
  const wrapper = shallow(<Divider />);
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
}

/**
 * @description Mount the sidebar header component to
 * verify component renders correctly.
 */
async function sidebarHeaderRender() {
  // Render sidebar header component
  const wrapper = shallow(<SidebarHeader />);
  // Expect component to be in DOM
  chai.expect(wrapper.exists()).to.equal(true);
}
