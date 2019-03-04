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
 * @description This renders a project's home page.
 */

// React Modules
import React from 'react';

// Define function
function ProjectHome(props) {
    // Initialize variables
    const project = props.project;
    const orgId = project.org;
    const projId = project.id;

    // Render project data in table format
    return (
        <div id='view' className='project-home'>
            <h2>{project.name}</h2>
            <hr />
            <table>
                <tr>
                    <th>ID:</th>
                    <td>{projId}</td>
                </tr>
                <tr>
                    <th>Org ID:</th>
                    <td>{orgId}</td>
                </tr>
                <tr>
                    <th>Custom:</th>
                    <td>{JSON.stringify(project.custom, null, 2)}</td>
                </tr>
            </table>
        </div>
    )
}

// Export function
export default ProjectHome
