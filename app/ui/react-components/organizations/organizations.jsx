/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.organizations
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
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
    }

    render () {

        return (
            <Router>
                <Switch>
                    <Route exact path="/organizations" component={OrganizationList} />
                    <Route path="/:orgid" component={Organization} />
                </Switch>
            </Router>
        );
    }

}

ReactDOM.render(<Organizations />, document.getElementById('main'));
