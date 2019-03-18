/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.home-page
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the homepage routing.
 */

// React Modules
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// MBEE Modules
import HomePage from '../home-views/home-page.jsx';
import Organization from '../organizations/organization.jsx';
import Project from '../projects/project.jsx';

// Define HomePage Component
class HomeApp extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);
    }

    render() {
        // Render the homepage
        return (
            <Router>
                <Switch>
                    {/*Route to homepage*/}
                    <Route exact path={'/'} component={HomePage}/> } />
                    {/*Route to organization*/}
                    <Route path="/:orgid" component={Organization} />
                    {/*Route to project*/}
                    <Route path="/:orgid/:projectid" component={Project}/> } />
                </Switch>
            </Router>

        );
    }
}

ReactDOM.render(<HomeApp />, document.getElementById('view'));
