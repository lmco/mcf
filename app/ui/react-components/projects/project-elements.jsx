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
import ElementList from '../elements/element-list.jsx';
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class ProjectElements extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            elements: null,
            error: null
        };
    }

    componentDidMount() {
        // Verify if there are no elements
        if (!this.props.elements){
            const orgId = this.props.match.params.orgid;
            const projId = this.props.match.params.projectid;
            const url = `/api/orgs/${orgId}/projects/${projId}`;

            // Grab all the elements
            ajaxRequest('GET',`${url}/branches/master/elements?ids=model`)
            .then(elements => {
                // Set the element state
                this.setState({ elements: elements });
            })
            .catch(err => {
                this.setState({error: `Failed to load elements: ${err}`});
            });
        }
    }

    render() {
        // Initialize element data
        let elements = null;

        // Verify if elements were in props
        if (!this.props.elements){
            // Set the element state
            elements = this.state.elements;
        }
        else {
            // Set the element state
            elements = this.props.elements;
        }

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
