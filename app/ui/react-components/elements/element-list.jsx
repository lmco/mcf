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
import { getRequest } from "../helper-functions/getRequest";
import List from '../general-components/list/list.jsx';
import ListItem from '../general-components/list/list-item.jsx';

// Define ElementList Component
class ElementList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            elementChildren: null,
            error: null
        };

        // Bind component functions
        this.constructListItem = this.constructListItem.bind(this);
    }

    // Define recursive get request for element tree
    constructListItem(item) {
        // Create a new promise
        return new Promise((resolve, reject) => {
            // Initialize url
            const url = this.props.url;

            // Do a get request to the MBEE elements api
            getRequest(`${url}/branches/master/elements/${item}`)
                .then(containedElement => {
                    // Initialize variables
                    const promises = [];
                    const listItems = [];

                    // Check if element has contained elements
                    if (containedElement.contains.length > 0) {
                        // Loop through the contained elements
                        for (let i = 0; i < containedElement.contains.length; i++) {
                            // Put the elements in this function again and to the promise array
                            promises.push(this.constructListItem(containedElement.contains[i])
                                .then((listItem) => {
                                    // Put the contained elements into list array
                                    listItems.push(listItem);
                                })
                                // If an error is caught, throw error
                                .catch((err) => console.log(err))
                            )
                        }

                        // Resolve the promises
                        Promise.all(promises)
                        .then(() => {
                            // Return the element tree in html form
                            return resolve(
                                <List>
                                    <ListItem element={containedElement}/>
                                    <List className='guideline'>
                                        {listItems}
                                    </List>
                                </List>
                            );
                        })
                        // If caught error, throw error
                        .catch(err => {
                            console.log(err);
                        })
                    }
                    else {
                        // Return the element in html form
                        return resolve(
                            <List>
                                <ListItem key={item} element={containedElement}/>
                            </List>
                        );
                    }
                })
                // If caught error, throw error
                .catch(err => {
                    console.log(err);
                    return reject(err);
                })
        })
    }

    componentDidMount() {
        // Initialize variables
        const element = this.props.element;
        const promises = [];
        const listItems = [];

        // Loop through model element contains field
        for (let i = 0; i < element.contains.length; i++) {
            // Push promises to an array with the element recursive function
            promises.push(this.constructListItem(element.contains[i])
                .then((listItem) => {
                    // push the list items to an array
                    listItems.push(listItem);
                })
                // If caught error, throw error
                .catch((err) => this.setState({ error: err}))
            )
        }

        // Resolve the promises
        Promise.all(promises)
        .then(() => {
            // Set the element tree to the state
            this.setState({ elementChildren: listItems})
        })
        // If caught error, throw error
        .catch(err => {
            this.setState({ error: err});
        })
    }



    render() {
        // Renders the element tree
        return (
            <List className='guideline'>
                {(!this.state.elementChildren)
                    ? <div className="loading"> {this.state.error || 'Loading the project elements...'} </div>
                    : (this.state.elementChildren)
                }
            </List>
        )
    }
}


// Export component
export default ElementList
