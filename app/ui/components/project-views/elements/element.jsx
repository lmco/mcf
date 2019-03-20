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
import {ajaxRequest} from "../../helper-functions/ajaxRequests";

// Define component
class Element extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      element: null,
      error: null
    };
  }

  componentDidMount() {
    // Initialize variables
    const elementId = this.props.id;
    const url = `${this.props.url}/branches/master/elements/${elementId}`;
    // Get project data
    ajaxRequest('GET', `${url}`)
    .then(element => {
      this.setState({ element: element });
    })
    .catch(err => {
      // Throw error and set state
      this.setState({ error: `Failed to load element: ${err.responsetext}` });
    });
  }

  render() {
    // Render the sidebar with the links above
    return (
      <div className='element-description'>
        <div className='other'>
          {(!this.state.element)
            ? <div className="loading"> {this.state.error || 'Loading your element...'} </div>
            : <h2> {this.state.element.id} </h2>
          }
        </div>
      </div>
    );
  }
}

// Export component
export default Element;
