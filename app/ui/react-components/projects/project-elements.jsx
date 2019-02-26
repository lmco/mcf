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
import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';
import ElementList from '../elements/element-list.jsx';

// Define component
class ProjectElements extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            isExpanded: false
        };

        // Bind component functions
        this.toggle = this.toggle.bind(this);
    }

    // Define toggle function
    toggle() {
        // Set expanded state
        this.setState({isExpanded: !this.state.isExpanded});
    }

    render() {
        // Return element list
        return (
            <div id='view' className='project-elements'>
                <h2>Elements</h2>
                <hr/>
                <List>
                    <ListItem element={this.props.element} />
                    {/*Render element tree*/}
                    <ElementList element={this.props.element} url={this.props.url}/>
                </List>
            </div>
        )
    }
}

// Export component
export default ProjectElements
