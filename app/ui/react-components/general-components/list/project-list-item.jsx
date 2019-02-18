/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.general-components.list
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
 * @description This renders the project list items.
 */
import React, { Component } from 'react';

import StatsList from '../stats/stats-list.jsx';
import Stat from '../stats/stat.jsx';

class ProjectListItem extends Component {
    constructor(props) {
        super(props);

        this.ref = React.createRef();

        this.handleResize = this.handleResize.bind(this);

        this.state = {
            width: 0,
        };
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
        const project = this.props.project;
        const stats = (
            <StatsList>
                <Stat title='Users' icon='fas fa-users' value={Object.keys(project.permissions).length} _key={`${project.id.split(':').join('-')}-users`} />
            </StatsList>
        );

        return (
            <div className='stats-list-item' ref={this.ref}>
                <div className='list-header'>
                    <p>{project.name}</p>
                </div>

                {(this.state.width > 600) ? stats : ''}
            </div>
        )
    }
}

export default ProjectListItem
