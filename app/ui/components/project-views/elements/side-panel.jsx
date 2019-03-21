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

    // Initialize state props
    this.state = {
    };
  }

  render() {
    // Create the sidebar links
    const sidebarLink = React.Children.map(this.props.children, child => (
      ( // Clone the react element sidebar link and change expanded state
        (child.type === SidebarLink)
          ? React.cloneElement(child, { isExpanded: this.state.isExpanded })
          : child
      )
    ));

    // Render the sidebar with the links above
    return (
      <div id='sidebar' className='sidebar'>
        {/* Verify if title was provided and is expanded */}
        {(this.props.title && this.state.isExpanded)
          // Display the title
          ? (<React.Fragment>
            <div className='sidebar-header'>
              {this.props.title}
            </div>
            <hr/>
          </React.Fragment>)
          : ''
        }
        <div className='sidebar-links'>
          {sidebarLink}
        </div>
        <div className='sidebar-collapse'>
          <hr/>
          <SidebarLink id='Collapse'
                       title='Collapse'
                       icon='fas fa-angle-right'
                       tooltip='Expand Sidebar'
                       onClick={this.toggle}
                       isExpanded={this.state.isExpanded}/>
        </div>
      </div>
    );
  }

}

// Export component
export default Sidebar;
