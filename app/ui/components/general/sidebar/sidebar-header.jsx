/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.general.sidebar.sidebar-header.jsx
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a sidebar header.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */

import React from 'react';

/* eslint-enable no-unused-vars */

function SidebarHeader(props) {
  // Verify if the sidebar is expanded
  if (props.isExpanded) {
    return (<div className='nested-sidebar-header'>
              {props.title}
            </div>);
  }
  // Return an empty div if not expanded
  // NOTE: this is necessary
  else {
    return (<div/>);
  }
}

// Export component
export default SidebarHeader;
