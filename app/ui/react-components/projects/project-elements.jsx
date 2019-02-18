/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.projects
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a project's element page.
 */
import React, { Component } from "react";
import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';
import ElementList from '../elements/element-list.jsx';

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

        return (
            <div id='view' className='project-elements'>
                <h2>Elements</h2>
                <hr/>
                <List>
                    <ListItem element={this.props.element} />
                    <ElementList element={this.props.element} url={this.props.url}/>
                </List>
            </div>
        )
    }
}

export default ProjectElements
