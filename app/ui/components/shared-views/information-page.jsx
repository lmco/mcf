/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.shared-views.information-page
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders an organization or project home page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';

// MBEE Modules
import CustomData from '../general/custom-data/custom-data.jsx';
/* eslint-enable no-unused-vars */

function InformationPage(props) {
  // Initialize variables
  let name;
  let id;
  let orgid = null;
  let custom;

  if (props.org) {
    name = props.org.name;
    id = props.org.id;
    custom = props.org.custom;
  }
  else {
    name = props.project.name;
    id = props.project.id;
    orgid = props.project.org;
    custom = props.project.custom;
  }

  return (
    <div id='workspace'>
      <div id='workspace-header' className='workspace-header'>
        <h2 className='workspace-title workspace-title-padding'>{name}</h2>
      </div>
      <div id='workspace-body'>
        <div className='main-workspace extra-padding'>
          <table>
            <tbody>
              <tr>
                <th>ID:</th>
                <td>{id}</td>
              </tr>
              {(orgid === null)
                ? <tr/>
                : (<tr>
                    <th>Org ID:</th>
                    <td><a href={`/${orgid}`}>{orgid}</a></td>
                   </tr>)
              }
            </tbody>
          </table>
          <CustomData data={custom}/>
        </div>
      </div>
    </div>
  );
}

export default InformationPage;
