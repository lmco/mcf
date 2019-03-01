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
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import OrganizationList from './organization-list.jsx';
import Organization from './organization.jsx';
import { getRequest } from '../helper-functions/getRequest.js';

class Organizations extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null
        };
    }

    componentDidMount(){
        getRequest('/api/users/whoami')
        .then(user => {
            this.setState({user: user});
        })
    }

    render () {
        return (
            <Router>
                <Switch>
                    <Route exact path="/organizations" component={OrganizationList} />
                    <Route path="/:orgid" render={(props) => <Organization {...props} user={this.state.user}/>} />
                </Switch>
            </Router>
        );
    }

}

ReactDOM.render(<Organizations />, document.getElementById('main'));
