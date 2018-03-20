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
 * OrgList.jsx
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This is going to be used to start testing the API.
 */
class OrgList extends React.Component {

    constructor() {
        super();
        this.state = {
            version: null 
        }
    }

    componentDidMount() {
        fetch('http://localhost:8080/api/version', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 123456ABCDEF',
            }
        }).then(response => {
            console.log(response);
            console.log(response.body);
            return response.json();
        }).then(data => {
            console.log(data);
            var mbee_version = data['version'];
            console.log(mbee_version);
            this.setState({version: mbee_version});
        });
    }


    render() {
        return (
            <div>
                <div>This is the OrgList</div>
                <div>Version: {this.state.version}</div>
            </div>
        );
    }
}