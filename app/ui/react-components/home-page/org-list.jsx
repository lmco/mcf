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
 *
 * @description This creates the organization and project list .
 */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import ProjectListItem from '../general-components/list/project-list-item.jsx';


class OrgList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            showProjs: false,
            width: null,
            projects: []
        };

        // Bind component functions
        this.handleOrgToggle = this.handleOrgToggle.bind(this);
    }

    // Define org toggle functionality
    handleOrgToggle() {
        // Set the state to opposite of its initial state
        this.setState({ showProjs: !this.state.showProjs });
    }

    render() {
        // Initialize variables
        const orgId = this.props.org.id;

        // Loop through projects in each org
        const projects = this.props.org.projects.map(project => {
            // Create project links
            return (
                <ProjectListItem project={project} href={`/${orgId}/${project.id}`}/>
            )
        });

        let icon;

        if (this.state.showProjs) {
            icon = 'fas fa-angle-down'
        } else {
            icon = 'fas fa-angle-right'
        }

        // Return the list of the orgs with projects
        return (
            <React.Fragment>
                <div className='org-proj-list'>
                    <div className='org-icon' onClick={this.handleOrgToggle}>
                        <i className={icon}/>
                    </div>
                    <OrgListItem className='org-info' org={this.props.org} href={`/${orgId}`}/>
                </div>
                {(!this.state.showProjs)
                    ? ''
                    :(<List className='projects-list'>
                        {projects}
                      </List>)
                }
            </React.Fragment>
        )
    }
}

// Export component
export default OrgList;
