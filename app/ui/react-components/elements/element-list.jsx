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
import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';

// Define component
class ElementList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            isOpen: false
        };

        // Bind component functions
        this.toggle = this.toggle.bind(this);
    }

    // Define toggle function
    toggle() {
        // Change state of isOpen
        this.setState({ isOpen: !this.state.isOpen });
    }

    // Create the element tree list
    render() {
        // Initialize variables
        const element = this.props.element;
        const containsData = element.contains;
        const lengthData = Object.keys(containsData).length;

        // Check if element has children
        if (lengthData > 0) {
            // Loop through children recursively call ElementList
            const elementList = Object.keys(containsData).map((key) => {
                return ( <ElementList element={containsData[key]}/> )
            });

            // Return the List
            return (<List>
                        <ListItem element={element} onClick={this.toggle}/>
                        <List className='guideline'>
                            {(!this.state.isOpen)
                                ? elementList
                                : ''
                            }
                        </List>
                    </List>)
        }
        else {
            return (<List>
                <ListItem element={element} onClick={this.toggle}/>
            </List>)
        }
    }
}

// Export Element
export default ElementList
