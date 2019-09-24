/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.apps.admin-console-app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the admin console page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import Sidebar from '../general/sidebar/sidebar.jsx';
import SidebarLink from '../general/sidebar/sidebar-link.jsx';
import UserList from '../admin-console-views/user-list.jsx';
import OrganizationList from '../profile-views/organization-list.jsx';
import ProjectList from '../profile-views/project-list.jsx';

// Define component
class AdminConsoleHome extends Component {

  /* eslint-enable no-unused-vars */

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      error: null
    };
  }

  render() {
    // Return admin console
    return (
      <Router>
        <div id='container'>
          { /* Create the sidebar with sidebar links */ }
          <Sidebar title='Admin Console'>
            <SidebarLink id='user-list'
                         title='User Managment'
                         icon='fas fa-users'
                         routerLink='/admin'/>
            <SidebarLink id='organization-list'
                         title='Organizations'
                         icon='fas fa-box'
                         routerLink='/admin/orgs'/>
            <SidebarLink id='project-list'
                         title='Projects'
                         icon='fas fa-boxes'
                         routerLink='/admin/projects'/>
          </Sidebar>
          { // Define routes for admin page
            <Switch>
              { /* Route to user management page (home page of admin console) */ }
              <Route exact path='/admin'
                     render={(props) => (<UserList {...props}/>)}/>
              { /* Route to organizations management page */ }
              <Route exact path='/admin/orgs'
                     render={(props) => (<OrganizationList {...props}
                                                           adminPage={true}/>)}/>
              { /* Route to projects management page */ }
              <Route exact path='/admin/projects'
                     render={(props) => (<ProjectList {...props}
                                                      adminPage={true}/>)}/>
            </Switch>
          }
        </div>
      </Router>
    );
  }

}

export default AdminConsoleHome;
