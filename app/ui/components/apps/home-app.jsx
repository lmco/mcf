/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.apps.home-app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the homepage.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React from 'react';
import ReactDOM from 'react-dom';

import Home from '../home-views/home.jsx';

ReactDOM.render(<Home />, document.getElementById('main'));
