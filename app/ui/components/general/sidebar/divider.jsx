/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.general.sidebar.divider
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This renders a sidebar divider.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

import React, { Component } from 'react';

class Divider extends Component {

  render() {
    return (<hr className={'divider'}/>);
  }

}

// Export component
export default Divider;
