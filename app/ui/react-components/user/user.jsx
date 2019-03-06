/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.user
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

// React Modules
import React, { Component } from 'react';
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import Sidebar from '../general-components/sidebar/sidebar.jsx'
import SidebarLink from '../general-components/sidebar/sidebar-link.jsx'
import UserHome from './user-home.jsx';
import UserEdit from './user-edit.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class User extends Component {
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
        ajaxRequest('GET','/api/users/whoami')
        .then(user => {
            // Set user state
            this.setState({ user: user});
        })
        .catch(err => {
            // Throw error and set state
            this.setState({error: `Failed to load user information: ${err}`});
        });
    }

    render() {
        // Return user page
        return (
            <Router>
                <React.Fragment>
                    {/*Create the sidebar with sidebar links*/}
                    <Sidebar>
                        <SidebarLink id='Home' title='Home' icon='fas fa-home' exact path="/whoami" />
                        <SidebarLink id='Org' title='Organizations' icon='fas fa-boxes' href={`/organizations`} />
                        <SidebarLink id='Proj' title='Projects' icon='fas fa-box' href={`/projects`} />
                        <hr />
                        <SidebarLink id='Edit' title='Edit' icon='fas fa-cog' routerLink={'/whoami/edit'} />
                    </Sidebar>
                    {/*Verify user data exists*/}
                    {(!this.state.user)
                        // Display loading page or error page if user data is loading or failed to load
                        ? <div
                            className="loading"> {this.state.error || 'Loading your information...'} </div>
                        : (<Switch>
                                {/*Route to user home page*/}
                                <Route exact path="/whoami"
                                       render={ (props) => <UserHome {...props} user={this.state.user} /> } />
                                {/*Route to user edit page*/}
                                <Route exact path={'/whoami/edit'}
                                       render={ (props) => <UserEdit {...props} user={this.state.user} /> } />
                            </Switch>)
                    }
                </React.Fragment>
            </Router>
        );
    }
}

// Render on main html element
ReactDOM.render(<User />, document.getElementById('main'));
