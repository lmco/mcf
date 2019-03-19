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
import Element from './element.jsx';

// Define component
class ProjectElements extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);
  }

  render() {
    // Return element list
    return (
        <React.Fragment>
          <div id='elements-page' className='elements-page'>
            <div>
              <h2>Elements</h2>
              <hr/>
              <div id={'element-tree-container'}>
                  <ElementTree id={'model'}
                               project={this.props.project}
                               parent={null}
                               isOpen={true}/>
              </div>
            </div>
            <Element>
              <h2>Hello World.</h2>
            </Element>
          </div>
        </React.Fragment>
    )
  }
}

// Export component
export default ProjectElements
