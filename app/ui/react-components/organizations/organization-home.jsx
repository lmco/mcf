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
import React from 'react';

function OrganizationHome(props) {
    const org = props.org;

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

export default OrganizationHome
