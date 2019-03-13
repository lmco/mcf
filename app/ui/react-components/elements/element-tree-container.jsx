/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.elements
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the element tree in the project's page.
 */

// React Modules
import React, { Component } from 'react';


// MBEE Modules
import ElementTree from './element-tree.jsx';
//import ElementListItem from '../general-components/list/element-list-item.jsx';

// Define component
class ElementTreeContainer extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        console.log('ElementTreeContainer Props')
        console.log(props)
    }


    // Create the element tree list
    render() {
        return (
            <div id={'element-tree-container'}>
                The Element Tree Container
                <ElementTree id={'model'}
                             project={this.props.project}
                             parent={null}
                             isOpen={true}/>
            </div>
        )
    }
}

// Export component
export default ElementTreeContainer
