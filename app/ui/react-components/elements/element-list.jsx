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
import React from 'react';
import { getRequest } from "../helper-functions/getRequest";
import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';

function ElementList(props) {
    const { nodeElement, level, toggle, onNodeSelect, isOpen = false} = props;
    const elements = props.elements;
    const elementNodes = [];

    Object.key(elements).forEach((key) => {
        const nodeElements = elements[key].contains;
        if (nodeElement.length > 0 ) {
            return (
                <List>
                    <ListItem element={elements[key]} onClick={toggle}/>
                    {(!isOpen)
                        ? (<List className='guideline'>
                            <ElementList {...props} elements={nodeElements} level={level+1}/>
                           </List>)
                        : ''
                    }
                </List>
            )
        }
        else {
            return (
                <List>
                    <ListItem element={elements[key]}/>
                </List>
            )
        }
    });

    // toggle() {
    //     this.setState({isExpanded: !this.state.isExpanded});
    // }
    return ( <div>nothing</div> )
}



export default ElementList
