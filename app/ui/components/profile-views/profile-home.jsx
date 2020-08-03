/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile-home
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 *
 * @description This renders a user's profile home page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';

// MBEE modules
import Sidebar from '../general/sidebar/sidebar.jsx';
import SidebarLink from '../general/sidebar/sidebar-link.jsx';
import Profile from '../profile-views/profile.jsx';
import { userRequest } from '../app/api-client.js';

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

    this.refreshUser = this.refreshUser.bind(this);
    this.refreshOtherUser = this.refreshOtherUser.bind(this);
  }

  async componentDidMount() {
    const user = await this.refreshUser();

    if (this.props.match && this.props.match.params) {
      const username = this.props.match.params.username;
      if (username && username !== user.username) this.refreshOtherUser();
    }
  }

  async refreshUser() {
    // Initialize options for request
    const options = {
      method: 'GET',
      whoami: true,
      minified: true
    };
    const setError = (error) => this.setState({ error: error });

    // Get the user data
    const user = await userRequest(options, setError);

    // Set the user
    if (user) this.setState({ user: user });

    return user;
  }

  async refreshOtherUser() {
    // Initialize options for request
    const options = {
      method: 'GET',
      usernames: this.props.match.params.username,
      minified: true,
      includeArchived: true
    };
    const setError = (error) => this.setState({ error: error });

    // Get the user data
    const users = await userRequest(options, setError);

    // Set the other user
    if (users) this.setState({ otherUser: users[0] });
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
    console.log(user);

    // Return user page
    return (
      <div id='container'>
        { /* Create the sidebar with sidebar links */ }
        <Sidebar title={title}>
          <SidebarLink id='Information'
                       title='Information'
                       icon='fas fa-info'
                       routerLink={routerLink} />
        </Sidebar>
        { /* Verify user data exists */ }
        { // Display loading page or error page if user data is loading or failed to load
          (!user)
            ? <div id='view' className="loading"> {this.state.error || 'Loading information...'}</div>
            : (
              <Switch>
                  <Route exact path="/profile"
                         render={(props) => <Profile {...props}
                                                     admin={true}
                                                     user={this.state.user}
                                                     refreshUsers={this.refreshUser}/>}/>
                  <Route path={`/profile/${this.props.match.params.username}`}
                         render={(props) => <Profile {...props}
                                                     admin={user.admin}
                                                     viewingUser={user}
                                                     user={otherUser || user}
                                                     refreshUsers={this.refreshOtherUser}/>}/>
              </Switch>
            )
        }
      </div>
    );
  }

}

export default ProfileHome;
