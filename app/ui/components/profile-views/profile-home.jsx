// React Modules
import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

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
          </ModalBody>
        </Modal>
        <div id='workspace'>
          <div className='workspace-header header-box-depth'>
            <h2 className='workspace-title'>
              {user.fname} {user.lname}
            </h2>
            <div className='workspace-header-button'>
              {(!this.props.admin)
                ? ''
                : (<Button className='btn'
                           outline color="secondary"
                           onClick={this.handleToggle}>
                    Edit
                  </Button>)
              }
            </div>
          </div>
          <div id='workspace-body'>
            <div className='main-workspace extra-padding'>
              <table className='table-width'>
                <tbody>
                <tr>
                  <th>Username:</th>
                  <td>{user.username}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>{user.email}</td>
                </tr>
                </tbody>
              </table>
              <CustomData data={user.custom}/>
            </div>
          </div>
        </div>
      </Router>
    );
  }

}

export default ProfileHome;
