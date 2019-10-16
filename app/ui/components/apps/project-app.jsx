/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.apps.project-app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a project.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ReactDOM from 'react-dom';

import ProjectHome from '../project-views/project-home.jsx';

// Export component
ReactDOM.render(<Router>
                  <Switch>
                    <Route path={'/orgs/:orgid/projects/:projectid'} component={ProjectHome} />
                  </Switch>
                </Router>, document.getElementById('main'));
