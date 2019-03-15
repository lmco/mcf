/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the routes for the project pages.
 */

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ReactDOM from 'react-dom';

// MBEE Moduels
import ProjectList from './project-list.jsx';
import Project from './project.jsx';
import MakeRoute from '../general-components/make-route.jsx';

// Define component
class Projects extends Component {
  constructor(props) {
      // Initialize parent props
      super(props);

      // Initialize state props
      this.state = {
          user: null,
          error: null
      };
  }

  render() {
      const routes = [{
          path: '/projects',
          component: ProjectList
      },{
          path: '/:orgid/:projectid',
          component: Project
      }];

      // Return project routes
      return (
          <Router>
              <Switch>
                  {routes.map((route, index) => <MakeRoute key={index} {...route}/>)}
              </Switch>
          </Router>
      );
  }
}

// Render on main html element
ReactDOM.render(<Projects />, document.getElementById('main'));
