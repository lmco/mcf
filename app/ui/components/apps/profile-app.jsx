/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.apps.profile-app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a user's page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import Sidebar from '../general/sidebar/sidebar.jsx';
import SidebarLink from '../general/sidebar/sidebar-link.jsx';
import ProfileHome from '../profile-views/profile-home.jsx';
import OrganizationList from '../profile-views/organization-list.jsx';
import ProjectList from '../profile-views/project-list.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class ProfileApp extends Component {

/* eslint-enable no-unused-vars */

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      user: null,
      error: null
    };
  }

  componentDidMount() {
    // Get user data
    ajaxRequest('GET', '/api/users/whoami')
    .then(user => {
      // Set user state
      this.setState({ user: user });
    })
    .catch(err => {
      // Throw error and set state
      this.setState({ error: `Failed to load user information: ${err}` });
    });
  }

  render() {
    let title = 'Loading ...';
    if (this.state.user && this.state.user.preferredName) {
      title = `${this.state.user.preferredName}'s Profile`;
    }
    else if (this.state.user && this.state.user.fname) {
      title = `${this.state.user.fname}'s Profile`;
    }
    else if (this.state.user) {
      title = `${this.state.user.username}'s Profile`;
    }

    // Return user page
    return (
      <Router>
        <div id='container'>
          { /* Create the sidebar with sidebar links */ }
          <Sidebar
            title={title}>
            <SidebarLink id='Info'
                         title='Info'
                         icon='fas fa-info'
                         routerLink='/profile' />
            <SidebarLink id='Organization'
                         title='Organizations'
                         icon='fas fa-boxes'
                         routerLink='/profile/orgs'/>
            <SidebarLink id='Project'
                         title='Projects'
                         icon='fas fa-box'
                         routerLink='/profile/projects'/>
          </Sidebar>
          { /* Verify user data exists */ }
          { // Display loading page or error page if user data is loading or failed to load
            (!this.state.user)
              ? <div id='view' className="loading"> {this.state.error || 'Loading your information...'}</div>
              : (
                <Switch>
                  { /* Route to user home page */ }
                  <Route exact path="/profile"
                         render={ (props) => <ProfileHome {...props}
                                                          user={this.state.user} /> } />
                  { /* Route to org list page */ }
                  <Route exact path={'/profile/orgs'}
                         render={ (props) => <OrganizationList {...props}
                                                               user={this.state.user} /> }/>
                  { /* Route to project list page */ }
                  <Route exact path={'/profile/projects'}
                         render={ (props) => <ProjectList {...props}
                                                          user={this.state.user} /> } />
                </Switch>
              )
          }
        </div>
      </Router>
    );
  }

}

// Render on main html element
ReactDOM.render(<ProfileApp />, document.getElementById('main'));
