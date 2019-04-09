/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.general.custom-data.custom-data
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the custom data view.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import KeyData from './key-data.jsx';
/* eslint-enable no-unused-vars */

class CustomData extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      custom: this.props.data
    };
  }

  componentDidUpdate(prevProps) {
    // Verify if props were updated
    if (this.props.data !== prevProps.data) {
      // Update state with new props
      this.setState({ custom: this.props.data });
    }
  }

  render() {
    // Initialize variables
    const customData = this.state.custom;
    const keys = [];

    // Verify if custom data exists
    if (Object.keys(customData).length !== 0) {
      // Loop through custom data
      Object.keys(customData).forEach((key) => {
        // Create the key data view
        keys.push(<KeyData keyName={key} data={customData[key]}/>);
      });
    }
    else {
      // Create no custom data view
      keys.push('No Custom Data');
    }

    return (
      <React.Fragment>
        <div className='custom-header'>
          Custom Data:
        </div>
        <div className='custom-data'>
          {keys}
        </div>
      </React.Fragment>
    );
  }

}

export default CustomData;
