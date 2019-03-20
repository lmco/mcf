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
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the sidebar.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */
/* eslint no-undef: "warn" */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import SidebarLink from './sidebar-link.jsx';

// Define component
class Sidebar extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      isExpanded: false,
      forceClosed: false,
      windowWidth: 0
    };

    // Bind component functions
    this.handleResize = this.handleResize.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    // Grab html element and add a class to it
    document.getElementById('main').classList.add('main-sidebar');

    // Add event listener for window sizing
    window.addEventListener('resize', this.handleResize);

    // Handle initial size of window
    this.handleResize();
  }

  componentWillUnmount() {
    // Grab html element and remove class added
    document.getElementById('root').classList.remove('root-sidebar');

    // Remove event listener on window
    window.removeEventListener('resize', this.handleResize);
  }

  // Define handle resize function
  handleResize() {
    // Check the forceClosed state
    if (!this.state.forceClosed) {
      // Check for min window width and if sidebar is not expanded state
      if (this.state.windowWidth < 1200 && window.innerWidth >= 1200 && !this.state.isExpanded) {
        // toggle sidebar
        this.toggle();
      }
      // Check for max window width and if sidebar is expanded state
      if (this.state.windowWidth >= 1200 && window.innerWidth < 1200 && this.state.isExpanded) {
        // toggle sidebar
        this.toggle();
      }
    }
    // Set the window width state
    this.setState({ windowWidth: window.innerWidth });
  }

  // Define the open and close of the sidebar function
  toggle(event) {
    // Get the sidebar html element and toggle it
    document.getElementById('sidebar').classList.toggle('sidebar-expanded');
    // If window width changes force sidebar closed
    if (event) {
      if (window.innerWidth >= 1200 && this.state.isExpanded) {
        this.setState({ forceClosed: true });
      }
      else {
        this.setState({ forceClosed: false });
      }
    }
    // Change the expanded state
    this.setState({ isExpanded: !this.state.isExpanded });
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
