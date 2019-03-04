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
 * @description This renders an organization's home page.
 */

// React Modules
import React from 'react';

// Define function
function OrganizationHome(props) {
    // Initialize variables
    const org = props.org;

    // Render organization data in table format
    return (
        <div id='view' className='org-home'>
            <h2>{org.name}</h2>
            <hr />
            <table>
                <tr>
                    <th>ID:</th>
                    <td>{org.id}</td>
                </tr>
                <tr>
                    <th>Custom:</th>
                    <td>{JSON.stringify(org.custom, null, 2)}</td>
                </tr>
            </table>
        </div>
    )
}

// Export function
export default OrganizationHome
