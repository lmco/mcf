/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.projects
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
 *
 * @description This renders a project's home page.
 */
import React from 'react';

function ProjectHome(props) {
    const project = props.project;

    const orgId = project.org;
    const projId = project.id;

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

export default ProjectHome
