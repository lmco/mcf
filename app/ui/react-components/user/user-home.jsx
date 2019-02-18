/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.user
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
 * @description This renders a user's home page.
 */
import React from 'react';

function UserHome(props) {
    const user = props.user;

    return (
        <div id='view' className='user-home'>
            <h2>{user.name}</h2>
            <hr />
            <table>
                <tr>
                    <th>Username:</th>
                    <td>{user.username}</td>
                </tr>
                <tr>
                    <th>Email:</th>
                    <td>{user.email}</td>
                </tr>
                <tr>
                    <th>Custom:</th>
                    <td>{JSON.stringify(user.custom, null, 2)}</td>
                </tr>
            </table>
        </div>
    )
}

export default UserHome
