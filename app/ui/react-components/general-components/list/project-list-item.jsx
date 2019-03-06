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
 * @description This renders the project list items.
 */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import StatsList from '../stats/stats-list.jsx';
import Stat from '../stats/stat.jsx';

// Define component
class ProjectListItem extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: 0,
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
        // Event listener of the size of the window
        window.addEventListener('resize', this.handleResize);

        // Call function on resize of window
        this.handleResize();
    }

    componentWillUnmount() {
        // Remove event listener on the window
        window.removeEventListener('resize', this.handleResize);
    }

    // Define handle size function
    handleResize() {
        // Set the state prop to the client width
        this.setState({ width: this.ref.current.clientWidth })
    }

    render() {
        // Initialize variables
        const project = this.props.project;
        const stats = (
            // Create the stat list for the organization
            <StatsList>
                <Stat title='Users' icon='fas fa-users' value={Object.keys(project.permissions).length} _key={`project-${project.id.split(':').join('-')}-users`} />
            </StatsList>
        );

        // Render the organization stat list items
        return (
            <div className='stats-list-item' ref={this.ref}>
                <div className='list-header'>
                    <p>{project.name}</p>
                </div>
                {/*Verify width of client, remove stats based on width*/}
                {(this.state.width > 600) ? stats : ''}
            </div>
        )
    }
}

// Export component
export default ProjectListItem
