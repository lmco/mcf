/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.search
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the search page.
 */


// React Modules
import React, { Component } from 'react';
import {Input, Form, FormGroup} from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

class Search extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        this.state = {
            query: ""
        };

        // Bind component functions
        this.onChange = this.onChange.bind(this);
    }

    // Define change function
    onChange(event) {
        this.setState({ [event.target.name]: event.target.value});
    }

    render(){
        return (
            <div>
                <Form>
                    <FormGroup>
                        <Input type="text"
                               name="query"
                               id="query"
                               placeholder="Search"
                               value={this.state.query || ""}
                               onChange={this.onChange}
                               />
                    </FormGroup>
                </Form>
            </div>
        )
    }
}

// Export component
export default Search
