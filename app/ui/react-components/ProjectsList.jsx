/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/

/**
 * ProjectsList.jsx
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * A list of the user's projects.
 */

class ProjectsList extends React.Component {

    constructor() {
        super();
        this.state = {
            orgs: null
        }
    }

    componentDidMount() {
        fetch('/api/orgs', {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            console.log(response);
            console.log(response.body);
            return response.json();
        }).then(data => {
            console.log(data);
            this.setState({orgs: data});
        });
    }


    render() {
        return (
            <span>{this.state.orgs}</span>
        );
    }
}