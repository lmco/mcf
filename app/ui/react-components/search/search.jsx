/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.search.search
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This renders the search page.
 */


// React Modules
import React, { Component } from 'react';
import {Input, Form, FormGroup, Button, Row, Col} from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';
import SearchResults from '../search/search-results.jsx';

class Search extends Component{
    constructor(props) {
        // Initialize parent props
        super(props);

        this.state = {
            query: "",
            results: null
        };

        // Bind component functions
        this.onChange = this.onChange.bind(this);
        this.doSearch = this.doSearch.bind(this);
    }

    // Define change function
    onChange(event) {
        this.setState({ [event.target.name]: event.target.value});
    }

    doSearch() {
        // Build query URL
        const oid = this.props.project.org;
        const pid = this.props.project.id;
        const url = `/api/orgs/${oid}/projects/${pid}/branches/master/elements/search`;

        // Do ajax request
        $.ajax({
            method: "GET",
            url: `${url}?query=${this.state.query}`
        })
        .done(data => {
            this.setState({ results: data });
        })
        .fail(res => {
            if (res.status === 404) {
                this.setState({ results: []});
            }
        });
    }

    render() {
        return (
            <div id={'search'}>
                <Form className={'search-form'} inline>
                    <Row form>
                        <Col md={10} sm={6}>
                            <FormGroup id={'search-input-form-group'} className={"mb-2 mr-sm-2 mb-sm-0"}>
                                <Input type="text"
                                       name="query"
                                       id="query"
                                       placeholder="Search"
                                       value={this.state.query || ""}
                                       onChange={this.onChange}
                                       />
                            </FormGroup>
                        </Col>
                        <Col md={2} sm={6}>
                            <Button className='btn'
                                    outline color="primary"
                                    onClick={this.doSearch}>
                                Search
                            </Button>
                        </Col>
                    </Row>
                </Form>

                <div>
                    <SearchResults results={this.state.results}/>
                </div>
            </div>
        )
    }
}

// Export component
export default Search
