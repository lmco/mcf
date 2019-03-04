/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.organizations
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
 * @description This renders an organization's projects list.
 */

// React Modules
import React from 'react';

// MBEE Modules
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';

// Define function
function OrganizationProjects(props) {
    // Initialize variables
    const org = props.org;

    // Loop through the org's projects
    const listItems = org.projects.map(project =>
        // Create the project list item
        <ListItem href={`/${org.id}/${project.id}`}> {project.name} </ListItem>
    );

    // Return the org's project list
    return (
        <div id='view' className='org-projects'>
            <h2>Projects</h2>
            <hr />
            <List>
                {listItems}
            </List>
        </div>
    )
}

// Export function
export default OrganizationProjects
