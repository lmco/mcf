/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.VersionNumber
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This is going to be used to start testing the API.
 */
class VersionNumber extends React.Component {

    constructor() {
        super();
        this.state = {
            version: null
        }
    }

    componentDidMount() {
        fetch('/api/version', {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            return response.json();
        }).then(data => {
            var mbee_version = data['version'];
            this.setState({version: mbee_version});
        });
    }


    render() {
        return (
            <span>{this.state.version}</span>
        );
    }
}
