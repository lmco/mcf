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
import ReactDOM from "react-dom";

// MBEE Moduels
import ProjectList from './project-list.jsx';
import Project from './project.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

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

  componentDidMount(){
    // Get user data
    ajaxRequest('GET','/api/users/whoami')
    .then(user => {
        // Set user state
        this.setState({user: user});
    })
    .catch((err) => this.setState({error: err.responseJSON.description}))
  }

  render() {
      // Return project routes
      return (
          <Router>
              <Switch>
                  {/*Route to projects list*/}
                  <Route exact path="/projects" component={ProjectList} />
                  {/*Route to a project's home page*/}
                  <Route path="/:orgid/:projectid" render={ (props) => <Project {...props} user={this.state.user}/> } />
              </Switch>
          </Router>
      );
  }
}

// Render on main html element
ReactDOM.render(<Projects />, document.getElementById('main'));
