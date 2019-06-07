/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.shared-views.list-items.user-list-item
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the user list items.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import StatsList from '../../general/stats/stats-list.jsx';
import Stat from '../../general/stats/stat.jsx';

/* eslint-enable no-unused-vars */

// Define component
class UserListItem extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      user: this.props.user,
      error: null
    };
  }

  componentDidMount() {
    const user = this.props.user;
    if ((typeof user !== 'object') && !this.props.label) {
      const url = `/api/users/${this.props.user}`;

      // Get project data
      $.ajax({
        method: 'GET',
        url: `${url}?minified=true&archived=true`,
        statusCode: {
          200: (userInfo) => {
            // Set states
            this.setState({ user: userInfo });
          },
          401: (error) => {
            // Throw error and set state
            this.setState({ error: error.responseText });

            // Refresh when session expires
            window.location.reload();
          },
          404: (error) => {
            this.setState({ error: error.responseText });
          }
        }
      });
    }
  }

  render() {
    // Initialize variables
    const user = this.state.user;
    const perm = this.props.permission;
    let name;
    let classNames = 'list-header';
    let minimizeClass;
    let stats;
    let archivedClass;

    if (this.props.label) {
      classNames = 'template-item minimize';
      minimizeClass = 'minimize';
    }

    if (this.props.adminLabel && user.admin) {
      stats = (<StatsList>
                <Stat title='Admin'
                      icon='fas fa-check'
                      className={minimizeClass}
                      label={this.props.label}
                      _key={this.props._key}/>
               </StatsList>);
    }
    else if (perm) {
      if (!this.props.label) {
        minimizeClass = 'spacing minimize';
      }
      let permChecks;
      // Verify which permissions user has
      if (perm === 'admin') {
        // Add read permission check
        permChecks = [
          <Stat title='Read'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`read-${user.username}`}/>,
          <Stat title='Write'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`write-${user.username}`}/>,
          <Stat title='Admin'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`admin-${user.username}`}/>
        ];
      }
      else if (perm === 'write') {
        permChecks = [
          <Stat title='Read'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`read-${user.username}`}/>,
          <Stat title='Write'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`write-${user.username}`}/>,
          <Stat title=''
                icon='fas fa-window-minimize'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`admin-${user.username}`}/>
        ];
      }
      else if (perm === 'read') {
        // Add admin permission check
        permChecks = [
          <Stat title='Read'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`read-${user.username}`}/>,
          <Stat title=''
                icon='fas fa-window-minimize'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`write-${user.username}`}/>,
          <Stat title=''
                icon='fas fa-window-minimize'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                _key={`admin-${user.username}`}/>
        ];
      }

      // Return new stat list
      stats = (
        <StatsList key='statlist-perms'>
          {permChecks}
        </StatsList>);
    }

    if (user && user.fname) {
      name = `${user.fname} ${user.lname}`;
    }

    if (user.archived) {
      archivedClass = 'grayed-out';
    }
    // Render the organization stat list items
    return (
      <div className={`stats-list-item ${this.props.className}`} ref={this.ref}>
        <div id='username-header' className={classNames}>
          <a href={this.props.href}>
            <span className={archivedClass}>
              {name}
            </span>
          </a>
          <div className={archivedClass}>
            <span>{user.username}</span>
          </div>
          {(!this.props.adminState)
            ? ''
            : (<React.Fragment>
              <div className={archivedClass}>
                <span>{user.preferredName}</span>
              </div>
              <div className={archivedClass}>
                <span>{user.email}</span>
              </div>
            </React.Fragment>)
          }
        </div>
        {stats}
      </div>
    );
  }

}

// Export component
export default UserListItem;
