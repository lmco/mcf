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
 *
 * @description This renders a project's element page.
 */

// React Modules
import React, { Component } from "react";

// MBEE Modules
import ElementTreeContainer from '../elements/element-tree-container.jsx';

// Define component
class ProjectElements extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        console.log('Project Elements Props')
        console.log(props)

        // Initialize state props
        this.state = {
            elements: null,
            error: null
        };
    }

    componentDidMount() {
    }

    render() {
        // Return element list
        return (
            <div id='view' className='project-elements'>
                <h2>Elements</h2>
                <hr/>
                <ElementTreeContainer project={this.props.project}/>
            </div>
        )
    }
}

// Export component
export default ProjectElements
