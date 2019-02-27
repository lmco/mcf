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
import ElementList from "../elements/element-list.jsx";

// Define component
class ProjectElements extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);
    }

    render() {
        // Initialize element data
        const elements = this.props.elements;

        // Loop through root elements
        const elementList = Object.keys(elements).map((key) => {
            // Initialize root
            const rootElement = elements[key];

            // Create the element list
            return (<ElementList element={rootElement} />)
        });

        // Return element list
        return (
            <div id='view' className='project-elements'>
                <h2>Elements</h2>
                <hr/>
                {elementList}
            </div>
        )
    }
}

// Export component
export default ProjectElements
