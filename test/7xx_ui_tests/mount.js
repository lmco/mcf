/**
 * @classification UNCLASSIFIED
 *
 * @module test.7xx_ui_tests.mount
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
const createHistory = require('history').createMemoryHistory;
import { mount as enzymeMount } from 'enzyme';
// import createHistory from 'history/createMemoryHistory';
import React from 'react';
import { Router } from 'react-router-dom';
// import { Provider } from 'react-redux';
// import { ConnectedRouter } from 'react-router-redux';
// import Immutable from 'seamless-immutable';

// import initialize from 'src/store/initialize';

/**
 * Given a component, mounts it inside of Enzyme.
 *
 * @param  {Node} component A React node to mount.
 * @param  {Object} state   The default state to use in the Redux store.
 *
 * @return {Object} The mounted Enzyme object.
 */
export default function mount(component, state = {}) {
  let entry = '/';
  if (state.location) entry = `${state.location.pathname || '/'}${state.location.search}`;

  const history = createHistory({
    initialEntries: [entry]
  });
  // console.log(entry);
  // console.log(history);

  // const store = initialize(Immutable.from(state), history);

  return enzymeMount(
    <Router history={history}>
      {component}
    </Router>
  );
}
