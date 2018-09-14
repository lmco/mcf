/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.Org
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
 * @description A list of the user's projects.
 */
class Org extends React.Component {

    constructor() {
        super();
        this.state = {
            name: null
        }
    }

    componentDidMount() {
        fetch('/api/orgs/' + this.props.id, {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            return response.json();
        }).then(data => {
            console.log(data)
            this.setState({name: data['name']});
        });
    }


    render() {
        return (
            <span>{this.state.name}</span>
        );
    }
}
