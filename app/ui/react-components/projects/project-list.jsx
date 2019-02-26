/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the project list page.
 */

// React Modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';
import { getRequest } from '../helper-functions/getRequest';

// Define component
class ProjectList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: null,
            projects: []
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
        // Get projects user has permissions on
        getRequest('/api/projects')
        .then(projects => {
            // Set projects state
            this.setState({ projects: projects});
        })
        .catch(err => console.log(err));

        // Add event listener for window resizing
        window.addEventListener('resize', this.handleResize);

        // Set initial size of window
        this.handleResize();
    }

    componentWillUnmount() {
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        // Set state to width of window
        this.setState({ width: this.ref.current.clientWidth })
    }

    render() {
        // Loop through all projects
        const projects = this.state.projects.map(project => {
            // Initialize variables
            const orgId = project.org;

            // Create project links
            return (
                <Link to={`/${orgId}/${project.id}`}>
                    <ProjectListItem project={project}/>
                </Link>
            )
        });

        // Return projet list
        return (
            <div id='view' className='project-list' ref={this.ref}>
                <h2>Your Projects</h2>
                <hr/>
                {/*Verify if there are projects*/}
                {(this.state.projects.length === 0)
                    ? (<div className='list-item'>
                        <h3> No projects. </h3>
                       </div>)
                    // Display project list
                    : (<List>
                        {projects}
                       </List>)
                }
            </div>
        )
    }
}

// Export component
export default ProjectList
