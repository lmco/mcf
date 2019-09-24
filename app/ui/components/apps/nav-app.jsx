/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.apps.nav
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the nav bar.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';
import ReactDom from 'react-dom';

import MbeeNav from '../general/nav-bar.jsx';

// Render the navbar on the nav html element
ReactDom.render(<MbeeNav />, document.getElementById('nav'));
