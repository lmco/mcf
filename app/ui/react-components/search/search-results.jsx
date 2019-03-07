/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.search.search-results
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

import React, { Component } from 'react';
import SearchResult from '../search/search-result.jsx';

class SearchResults extends Component {

    constructor(props) {
        // Initialize parent props
        super(props);

        this.state = {
            results: props.results
        };

        // Bind component functions
        //this.onChange = this.onChange.bind(this);
        //this.doSearch = this.doSearch.bind(this);
    }

    render() {
        // If no results yet, render empty div
        if (!this.props.results) {
            return (<div></div>);
        }

        // If empty search results
        if (Array.isArray(this.props.results) && this.props.results.length === 0) {
            return (<div>No search results found.</div>);
        }

        const results = this.props.results.map(result => {
            return (<SearchResult key={result.id} data={result}/>)
        });

        return (
            <div className={'search-results'}>
                {results}
            </div>
        )
    }
}

// Export component
export default SearchResults
