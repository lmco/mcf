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
<<<<<<< HEAD
            elementChildren: null,
            error: null
        }
=======
            isOpen: false
        };
>>>>>>> e77e7ff967c4621cb7f8f15d57afb342e8eba53d

        // Bind component functions
        this.toggle = this.toggle.bind(this);
    }

<<<<<<< HEAD
    constructListItem(item) {
        return new Promise((resolve, reject) => {
            const url = this.props.url;

            getRequest(`${url}/branches/master/elements/${item}`)
                .then(containedElement => {
                    const promises = [];
                    const listItems = [];

                    if (containedElement.contains.length > 0) {
                        for (let i = 0; i < containedElement.contains.length; i++) {
                            promises.push(this.constructListItem(containedElement.contains[i])
                                .then((listItem) => {
                                    listItems.push(listItem);
                                })
                                .catch((err) => console.log(err))
                            )
                        }

                        Promise.all(promises)
                        .then(() => {
                            return resolve(
                                <List>
                                    <ListItem element={containedElement}/>
                                    <List className='guideline'>
                                        {listItems}
                                    </List>
                                </List>
                            );
                        })
                        .catch(err => {
                            console.log(err);
                        })
                    }
                    else {
                        return resolve(
                            <List>
                                <ListItem key={item} element={containedElement}/>
                            </List>
                        );
                    }
                })
                .catch(err => {
                    console.log(err);
                    this.setState({error: 'Failed to load elements.'});
                    return reject(err);
                })
        })
=======
    // Define toggle function
    toggle() {
        // Change state of isOpen
        this.setState({ isOpen: !this.state.isOpen });
>>>>>>> e77e7ff967c4621cb7f8f15d57afb342e8eba53d
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
                            {/*Verify if element children should be displayed*/}
                            {(!this.state.isOpen)
                                ? elementList
                                : ''
                            }
                        </List>
                    </List>)
        }
        else {
            // Return element
            return (<List>
                <ListItem element={element} onClick={this.toggle}/>
            </List>)
        }
<<<<<<< HEAD

        Promise.all(promises)
        .then(() => {
            this.setState({ elementChildren: listItems})
        })
        .catch(err => {
            console.log(err);
        })
    }



    render() {
        const element = this.props.element;
        if (element && this.state.elementChildren) {
            return (<List className='guideline'>
                {this.state.elementChildren}
            </List>)
        }
        else {
            return (<div className="loading"> {this.state.error || 'Loading your element...'} </div>)
        }
=======
>>>>>>> e77e7ff967c4621cb7f8f15d57afb342e8eba53d
    }
}

// Export Element
export default ElementList
