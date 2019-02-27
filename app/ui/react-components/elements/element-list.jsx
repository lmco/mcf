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
import React, { Component } from 'react';

import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';

class ElementList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false
        };

        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState({ isOpen: !this.state.isOpen });
    }

    render() {
        const element = this.props.element;
        const containsData = element.contains;
        const lengthData = Object.keys(containsData).length;

        if ((lengthData > 0) && !this.state.isOpen) {
            const elementList = Object.keys(containsData).map((key) => {
                const elementChildren = containsData[key];
                return ( <ElementList element={elementChildren}/> )
            });

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
