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
* @description This renders the sidebar.
*/

// React Modules
import React, { Component } from 'react';
import { Button } from 'reactstrap';

// Define component
class Element extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      isExpanded: true,
      forceClosed: false,
      windowWidth: 0
    };

    // Bind component functions
    this.handleResize = this.handleResize.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    // Grab html element and add a class to it
    document.getElementById('elements-page').classList.add('main-element');
    // Add event listener for window sizing
    window.addEventListener('resize', this.handleResize);

    // Handle initial size of window
    this.handleResize();
  }

  componentWillUnmount() {
    document.getElementById('elements-page').classList.remove('main-element');
    // Remove event listener on window
    window.removeEventListener('resize', this.handleResize);
  }

  // Define handle resize function
  handleResize() {
    // Check the forceClosed state
    if (!this.state.forceClosed){
      // Check for min window width and if sidebar is not expanded state
      if (this.state.windowWidth < 1200 && window.innerWidth >= 1200 && !this.state.isExpanded) {
        // toggle sidebar
        this.toggle()
      }
      // Check for max window width and if sidebar is expanded state
      if (this.state.windowWidth >= 1200 && window.innerWidth < 1200 && this.state.isExpanded) {
        // toggle sidebar
        this.toggle()
      }
    }
    // Set the window width state
    this.setState({ windowWidth: window.innerWidth })
  }

  // Define the open and close of the sidebar function
  toggle(event) {
    // Get the sidebar html element and toggle it
    document.getElementById('element-description').classList.remove('main-element');

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
    const children = React.Children.map(this.props.children, child => {
      return child;
    });

    // Render the sidebar with the links above
    return (
      <div id='element-description' className='element-description'>
        {/* Verify if title was provided and is expanded */}
        {(this.props.title && this.state.isExpanded)
          // Display the title
          ?(<React.Fragment>
            <div className='element-header'>
              {this.props.title}
            </div>
            <hr/>
          </React.Fragment>)
          : ''
        }
        <div className='element-links'>
          {children}
        </div>
        <div className='element-collapse'>
          <hr/>
          <Button id='exit'
                  title='exit'
                  onClick={this.toggle}>
            x
          </Button>
        </div>
      </div>
    );
  }
}

// Export component
export default Element;
