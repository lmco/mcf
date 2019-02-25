/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.list
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
 * @description This renders the organization list items.
 */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import StatsList from '../stats/stats-list.jsx';
import Stat from '../stats/stat.jsx';

// Define OrgListItem Component
class OrgListItem extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: 0,
        };

        // Create reference
        this.ref = React.createRef();

        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        this.setState({ width: this.ref.current.clientWidth })
    }

    render() {
        const org = this.props.org;
        const stats = (
            <StatsList>
                <Stat title='Projects' icon='fas fa-boxes' value={org.projects.length} _key={`${org.id}-projects`} />
                <Stat title='Users' icon='fas fa-users' value={Object.keys(org.permissions).length} _key={`${org.id}-users`} />
            </StatsList>
        );

        return (
            <div className='stats-list-item' ref={this.ref}>
                <div className='list-header'>
                    <p>{org.name}</p>
                </div>

                {(this.state.width > 600) ? stats : ''}
            </div>
        )
    }
}


export default OrgListItem
