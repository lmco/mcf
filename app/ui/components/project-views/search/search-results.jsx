/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.search.search-results
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner James Eckstein <james.eckstein@lmco.com>
 *
 * @author James Eckstein <james.eckstein@lmco.com>
 *
 * @description This renders the search results table elements.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

import React, { Component } from 'react';
import { Table, Col, Button } from 'reactstrap';
import SearchResult from './search-result.jsx';

/* eslint-enable no-unused-vars */
// Limit the number of columns to display in results table
const headerLimit = 5;
// Limit the search results to 10 records per page
const pageLimit = 10;

class SearchResults extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    this.getHeaders = this.getHeaders.bind(this);
    this.getRowsData = this.getRowsData.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.displayPageButtons = this.displayPageButtons.bind(this);
  }

  // Creates the Headers for the results table
  getHeaders() {
    const headers = Object.keys(this.props.results[0]);
    const keys = headers.slice(0, headerLimit);
    const headerRows = [];
    // Build header rows
    keys.forEach((key) => {
      /* eslint-disable-next-line no-undef */
      const headerName = (key === 'id') ? key.toUpperCase() : convertCase(key, 'proper');
      headerRows.push(
        <th key={key}>{headerName}</th>
      );
    });

    return headerRows;
  }

  // Generates the rows of element results
  getRowsData() {
    const headers = Object.keys(this.props.results[0]);
    const keys = headers.slice(0, headerLimit);
    const results = this.props.results;
    const rows = [];

    // Check if the results count is less than page limit - Use lower result to render rows.
    const numRows = (results.length < pageLimit) ? results.length : pageLimit;

    // Build result rows
    for (let index = 0; index < numRows; index++) {
      rows.push(
        <tr key={index}>
          <SearchResult key={index} data={results[index]} keys={keys}/>
        </tr>
      );
    }

    return rows;
  }

  // Handle page changes for paginated results
  onPageChange(event) {
    let page = this.props.page;
    let skip;

    if (event.target.name === 'next') {
      skip = (pageLimit * page);
      page += 1;
    }
    else if (event.target.name === 'prev') {
      skip = (page > 1) ? ((page - 1) * pageLimit) - pageLimit : 0;
      page -= 1;
    }

    // Build query URL
    const url = `${this.props.apiUrl}&skip=${skip}`;

    // Do ajax request
    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        401: () => {
          // Refresh when session expires
          window.location.reload();
        }
      }
    })
    .done(data => {
      this.props.handlePageChange(data, page);
    })
    .fail(res => {
      if (res.status === 404) {
        this.props.handlePageChange([], page);
      }
    });
  }

  // Displays prev/next buttons based on record count and current page
  displayPageButtons() {
    const currentPage = this.props.page;
    const results = this.props.results;

    const btnPrev = (currentPage > 1)
      ? <Button id='btn-prev-result-page'
                name='prev'
                type='button'
                onClick={(event) => this.onPageChange(event)}>{'< Prev'}</Button>
      : '';

    const btnNext = (results.length > pageLimit)
      ? <Button id='btn-next-result-page'
                name='next'
                type='button'
                onClick={(event) => this.onPageChange(event)}>{'Next >'}</Button>
      : '';

    return (
      <div id='btn-pagination-grp'>
        { btnPrev }
        { btnNext }
      </div>
    );
  }

  render() {
    // If no results yet, render empty div
    if (!this.props.results) {
      return (<div/>);
    }

    // If empty search results
    if (Array.isArray(this.props.results) && this.props.results.length === 0) {
      return (<div className='no-results'>No search results found.</div>);
    }

    return (
      <div className='search-container'>
        <Col id='search-results' sm={10}>
          <Table striped style={{ margin: '0px' }}>
            <thead className='template-item'>
              <tr>
                { this.getHeaders() }
              </tr>
            </thead>
            <tbody className='search-body'>
              { this.getRowsData() }
            </tbody>
          </Table>
          { this.displayPageButtons() }
        </Col>
      </div>
    );
  }

}

// Export component
export default SearchResults;
