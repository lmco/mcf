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

// Define component
class ProjectElements extends Component {


  render() {
    // Return element list
    return (
      <div id='view' className='project-elements'>
        <h2>Elements</h2>
        <hr/>
        <div id={'element-tree-container'}>
            <ElementTree id={'model'}
                         project={this.props.project}
                         parent={null}
                         isOpen={true}/>
        </div>
      </div>
    );
  }

}

// Export component
export default ProjectElements;
