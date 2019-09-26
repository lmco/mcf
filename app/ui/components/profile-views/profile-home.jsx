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
 * @description This renders the routes for profile page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import Sidebar from '../general/sidebar/sidebar.jsx';
import SidebarLink from '../general/sidebar/sidebar-link.jsx';
import Profile from '../profile-views/profile.jsx';
import OrganizationList from '../profile-views/organization-list.jsx';
import ProjectList from '../profile-views/project-list.jsx';

// Define component
class ProfileHome extends Component {

  /* eslint-enable no-unused-vars */

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      user: null,
      otherUser: null,
      error: null
    };
  }

  componentDidMount() {
    // eslint-disable-next-line no-undef
    mbeeWhoAmI((err, data) => {
      if (err) {
        this.setState({ error: err.responseText });
      }
      else {
        this.setState({ user: data });

        const username = this.props.match.params.username;
        if (username && (username !== 'projects') && (username !== 'orgs')) {
          const url = `/api/users/${username}`;
          $.ajax({
            method: 'GET',
            url: `${url}?minified=true&includeArchived=true`,
            statusCode: {
              200: (otherUser) => {
                // Set states
                this.setState({ otherUser: otherUser });
              },
              401: (error) => {
                // Throw error and set state
                this.setState({ error: error.responseText });
              },
              404: (error) => {
                this.setState({ error: error.responseText });
              }
            }
          });
        }
      }
    });
  }

  render() {
    let title = 'Loading ...';
    let routerLink = '/profile';
    const otherUser = this.state.otherUser;
    const user = this.state.user;

    if (otherUser !== null) {
      routerLink = `/profile/${otherUser.username}`;
      if (otherUser.preferredName) {
        title = `${otherUser.preferredName}'s Profile`;
      }
      else if (otherUser.fname) {
        title = `${otherUser.fname}'s Profile`;
      }
      else {
        title = `${this.state.user.username}'s Profile`;
      }
    }
    else if (user && user.preferredName) {
      title = `${user.preferredName}'s Profile`;
    }
    else if (user && user.fname) {
      title = `${user.fname}'s Profile`;
    }
    else if (user) {
      title = `${user.username}'s Profile`;
    }

    // Return user page
    return (
      <Router>
        <div id='container'>
          { /* Create the sidebar with sidebar links */ }
          <Sidebar title={title}>
            <SidebarLink id='Information'
                         title='Information'
                         icon='fas fa-info'
                         routerLink={routerLink} />
            {/* Verify it is not a different users profile, do not return */}
            {/* Org or project page for other user profile */}
            {/* NOTE: Orgs and projects are split in two ternary operators */}
            {/* due to abnormal rendering when in a react fragment */}
            {(otherUser !== null)
              ? ''
              : (<SidebarLink id='Organization'
                              title='Organizations'
                              icon='fas fa-box'
                              routerLink='/profile/orgs'/>)
            }
            {(otherUser !== null)
              ? ''
              : (<SidebarLink id='Project'
                              title='Projects'
                              icon='fas fa-boxes'
                              routerLink='/profile/projects'/>)
            }
          </Sidebar>
          { /* Verify user data exists */ }
          { // Display loading page or error page if user data is loading or failed to load
            (!user)
              ? <div id='view' className="loading"> {this.state.error || 'Loading information...'}</div>
              : (
                <Switch>
                  {/* Verify if user is view their own profile, then return their info  */}
                  {(otherUser === null)
                    ? (<React.Fragment>
                      {/* Route to user home page */}
                      <Route exact path="/profile" render={(props) => <Profile {...props}
                                                                                   admin={true}
                                                                                   user={this.state.user} />}
                      />
                      {/* Route to org list page */}
                      <Route exact path={'/profile/orgs'}
                             render={(props) => <OrganizationList {...props}
                                                                  user={this.state.user} /> }/>
                      {/* Route to project list page */}
                      <Route exact path={'/profile/projects'}
                             render={(props) => <ProjectList {...props}
                                                             user={this.state.user} /> } />
                    </React.Fragment>)
                    : (<Route path={`/profile/${this.props.match.params.username}`}
                              render={(props) => <Profile {...props}
                                                              admin={user.admin}
                                                              viewingUser={user}
                                                              user={otherUser} /> } />)

                  }
                </Switch>
              )
          }
        </div>
      </Router>
    );
  }

}

export default ProfileHome;
