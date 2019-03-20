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

    this.openElementInfo = this.openElementInfo.bind(this);
    this.closeElementInfo = this.closeElementInfo.bind(this);
  }

  // Define the open and close of the element side panel function
  openElementInfo(id) {
    // Toggle the element side panel
    this.setState({ sidePanelOpen: true });

    // Change the expanded state
    this.setState( { id: id });
  }

  closeElementInfo() {
    this.setState({ sidePanelOpen: false });
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
                         clickHandler={this.openElementInfo}/>
          </div>
          {(!this.state.sidePanelOpen)
            ? ''
            : (<Element id={this.state.id}
                        project={this.props.project}
                        url={this.props.url}
                        closeElementInfo={this.closeElementInfo}/>)
          }
        </div>
      </div>
    );
  }

}

// Export component
export default ProjectElements;
