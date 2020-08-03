/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.shared-views.list-items.user-list-item
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 *
 * @description This renders the user list items.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

// MBEE modules
import StatsList from '../../general/stats/stats-list.jsx';
import Stat from '../../general/stats/stat.jsx';
import { userRequest } from '../../app/api-client.js';

/* eslint-enable no-unused-vars */

// Define component
class UserListItem extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      user: this.props.user,
      width: 0,
      error: null
    };

    // Create reference
    this.ref = React.createRef();

    // Bind component functions
    this.handleResize = this.handleResize.bind(this);
  }

  // Define handle resize function
  handleResize() {
    // Set the state prop to the client width
    this.setState({ width: this.ref.current.clientWidth });
  }

  async componentDidMount() {
    const user = this.props.user;
    // Create event listener to resize window
    window.addEventListener('resize', this.handleResize);

    // Set initial size of window
    this.handleResize();

    if ((typeof user !== 'object') && !this.props.label) {
      // set options for request
      const options = {
        method: 'GET',
        ids: this.props.user,
        minified: true,
        includeArchived: true
      };
      const setError = (error) => this.setState({ error: error });

      // Get user data
      const users = await userRequest(options, setError);

      // Set user
      if (users) this.setState({ user: users[0] });
    }
  }

  componentWillUnmount() {
    // Remove event listener on window
    window.removeEventListener('resize', this.handleResize);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.user !== nextProps.user && typeof nextProps.user === 'object') {
      this.setState({ user: nextProps.user });
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
      stats = (<StatsList className='stats-list-member'>
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
                key={`read-${user.username}`}
                _key={`read-${user.username}`}/>,
          <Stat title='Write'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                key={`write-${user.username}`}
                _key={`write-${user.username}`}/>,
          <Stat title='Admin'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                key={`admin-${user.username}`}
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
                key={`read-${user.username}`}
                _key={`read-${user.username}`}/>,
          <Stat title='Write'
                icon='fas fa-check'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                key={`write-${user.username}`}
                _key={`write-${user.username}`}/>,
          <Stat title=''
                icon='fas fa-window-minimize'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                key={`admin-${user.username}`}
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
                key={`read-${user.username}`}
                _key={`read-${user.username}`}/>,
          <Stat title=''
                icon='fas fa-window-minimize'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                key={`write-${user.username}`}
                _key={`write-${user.username}`}/>,
          <Stat title=''
                icon='fas fa-window-minimize'
                className={minimizeClass}
                label={this.props.label}
                noToolTip={true}
                key={`admin-${user.username}`}
                _key={`admin-${user.username}`}/>
        ];
      }

      // Return new stat list
      stats = (
        <StatsList className='stats-list-member' key='statlist-perms'>
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
        <div id='user-list-items' className={classNames}>
          { this.props.link
            ? (<Link to={this.props.link}>
                <span className={archivedClass}>
                  {name}
                </span>
              </Link>)
            : <span className={archivedClass}>{name}</span>
          }
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
        {(this.state.width > 600) ? stats : ''}
      </div>
    );
  }

}

// Export component
export default UserListItem;
