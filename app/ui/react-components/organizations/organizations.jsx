/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.organizations
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the routes of the organization pages.
 */

// React Modules
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

// MBEE Modules
import OrganizationList from './organization-list.jsx';
import Organization from './organization.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class Organizations extends Component {
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
        // Get the users information
        ajaxRequest('GET','/api/users/whoami')
        .then(user => {
            // Set user state
            this.setState({user: user});
        })
        .catch((err) => this.setState({error: err.responseJSON.description}))
    }

    render() {
        return (
            <Router>
                <Switch>
                    {/*Route to organizations list*/}
                    <Route exact path="/organizations" component={OrganizationList} />
                    {/*Route to organization*/}
                    <Route path="/:orgid" render={(props) => <Organization {...props} user={this.state.user}/>} />
                </Switch>
            </Router>
        );
    }
}

// Render on main html element
ReactDOM.render(<Organizations />, document.getElementById('main'));
