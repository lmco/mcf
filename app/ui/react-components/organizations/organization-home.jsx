/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.organizations
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
