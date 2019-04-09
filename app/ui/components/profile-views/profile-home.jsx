/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.profile-views.profile-home
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

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React from 'react';

// Define function
function ProfileHome(props) {
  // Initialize variables
  const user = props.user;

  // Render user data in table format
  return (
    <div id='workspace'>
      <div id='workspace-header' className='workspace-header'>
        <h2 className='workspace-title workspace-title-padding'>{user.name}</h2>
      </div>
      <div id='workspace-body' className='extra-padding'>
        <table>
          <tbody>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Export function
export default ProfileHome;
