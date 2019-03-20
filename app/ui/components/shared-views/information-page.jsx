/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components
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
/* eslint no-unused-vars: "warn" */

// React Modules
import React from 'react';

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
        <div id='view' className='org-home'>
            <h2>{name}</h2>
            <hr />
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
                    <tr>
                        <th>Custom:</th>
                        <td>{JSON.stringify(custom, null, 2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
  );
}

export default InformationPage;
