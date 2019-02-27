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
import React, { Component } from "react";

import ElementList from "../elements/element-list.jsx";

class ProjectElements extends Component {
    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);

        this.state = {
            isExpanded: false
        };
    }

    toggle() {
        this.setState({isExpanded: !this.state.isExpanded});
    }

    componentDidMount() {

    }

    render() {
        const elements = this.props.elements;

        const elementList = Object.keys(elements).map((key) => {
            const rootElement = elements[key];
            return (<ElementList element={rootElement} />)
        });

        return (
            <div id='view' className='project-elements'>
                <h2>Elements</h2>
                <hr/>
                {elementList}
            </div>
        )
    }
}

export default ProjectElements
