/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This renders a project's element page.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import ElementTree from './element-tree.jsx';
import Element from './element.jsx';

// Define component
class ProjectElements extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);

    this.state = {
      sidePanelOpen: false,
      id: null
    };

    this.handleElementClick = this.handleElementClick.bind(this);
  }

  // Define the open and close of the element side panel function
  handleElementClick(id) {
    // Toggle the element side panel
    this.setState({ sidePanelOpen: !this.state.sidePanelOpen });

    // Change the expanded state
    this.setState( { id: id });
  }

  render() {
    // Return element list
    return (
      <div className='project-elements'>
        <h2>Elements</h2>
        <hr/>
        <div className='element-table'>
          <div id='element-tree-container'>
            <ElementTree id='tree-model'
                         project={this.props.project}
                         parent={null}
                         isOpen={true}
                         clickHandler={this.handleElementClick}/>
          </div>
          {(!this.state.sidePanelOpen)
            ? ''
            : (<Element id={this.state.id}/>)
          }
        </div>
      </div>
    );
  }

}

// Export component
export default ProjectElements;
