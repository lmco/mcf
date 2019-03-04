/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.user
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a user's home page.
 */

// React Modules
import React from 'react';

// Define function
function UserHome(props) {
    // Initialize variables
    const user = props.user;

    // Render user data in table format
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

// Export function
export default UserHome
