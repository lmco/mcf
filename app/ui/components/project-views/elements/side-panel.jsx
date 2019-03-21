/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.sidebar
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the side panel.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';

// Define component
class SidePanel extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);
  }

  render() {
    // Create the sidebar links
    const sidepanelDisplay = React.Children.map(this.props.children, child => child);

    // Render the sidebar with the links above
    return (
      <div className='side-panel'>
        {sidepanelDisplay}
      </div>
    );
  }

}

// Export component
export default SidePanel;
