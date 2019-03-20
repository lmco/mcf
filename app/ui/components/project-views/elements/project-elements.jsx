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

// React Modules
import React, { Component } from "react";

// MBEE Modules
import ElementTree from './element-tree.jsx';
import TestGrid from '../../apps/testing-grid.jsx';
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

  // Define the open and close of the sidebar function
  handleElementClick(event) {
    // Get the sidebar html element and toggle it
    this.setState({ sidePanelOpen: !this.state.sidePanelOpen });
    // If window width changes force sidebar closed
    // if (event) {
    //   if (window.innerWidth >= 1200 && this.state.isExpanded) {
    //     this.setState({forceClosed: true});
    //   }
    //   else {
    //     this.setState({forceClosed: false});
    //   }
    // }

    // Change the expanded state
    //this.setState( { id: event.target.id });
  }

  render() {
    // Return element list
    return (
      <div>
        <h2>Elements</h2>
        <hr/>
        <div className="t">
          <div className="c1">
            <div id='element-tree-container'>
              <ElementTree id='tree-model'
                           project={this.props.project}
                           parent={null}
                           isOpen={true}
                           onClick={this.handleElementClick}/>
            </div>
          </div>
          {(!this.state.sidePanelOpen)
            ? ''
            : (<div id='column' className="c2">
                <TestGrid/>
               </div>)
          }
        </div>
      </div>
    )
  }
}

// Export component
export default ProjectElements
