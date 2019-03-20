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

    };
  }

  render() {
    // Render the sidebar with the links above
    return (
      <div className='element-description'>
        <div className='other'>
          <h2>Hello World.</h2>
          <h2>{this.props.id}</h2>
        </div>
      </div>
    );
  }
}

// Export component
export default Element;
