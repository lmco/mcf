/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.search.search
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

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';
import { Input, Form, FormGroup, Button, Row, Col } from 'reactstrap';

// MBEE Modules
import SearchResults from './search-results.jsx';

class Search extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Parse the get parameters
    const getParams = {};
    const getParamsRaw = this.props.location.search.slice(1);
    getParamsRaw.split('&').forEach(keyValuePair => {
      const arr = keyValuePair.split('=');
      getParams[arr[0]] = arr[1];
    });

    this.state = {
      query: getParams.q || null,
      results: null,
      message: ''
    };

    // Bind component functions
    this.onChange = this.onChange.bind(this);
    this.doSearch = this.doSearch.bind(this);
  }

  componentDidMount() {
    if (this.state.query) {
      this.doSearch();
    }
  }

  // Define change function
  onChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  doSearch(e) {
    // Disable form submit
    if (e) {
      e.preventDefault();
    }

    // Pre-search reset message
    this.setState({
      message: ''
    });

    // Append search to URL
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: `?q=${this.state.query}`
    });

    // Build query URL
    const oid = this.props.project.org;
    const pid = this.props.project.id;
    const url = `/api/orgs/${oid}/projects/${pid}/branches/master/elements/search`;

    // Do ajax request
    const start = new Date();
    $.ajax({
      method: 'GET',
      url: `${url}?q=${this.state.query}`
    })
    .done(data => {
      const end = new Date();
      const elapsed = (end - start) / 1000;

      this.setState({
        results: data,
        message: `Got ${data.length} results in ${elapsed} seconds.`
      });
    })
    .fail(res => {
      if (res.status === 404) {
        this.setState({ results: [] });
      }
    });
  }

  render() {
    return (
      <div id='view'>
            <div id={'search'}>
                <Form id={'search-form'} className={'search-form'} inline>
                    <Row form>
                        <Col md={10} sm={8} xs={6}>
                            <FormGroup id={'search-input-form-group'} className={'mb-2 mr-sm-2 mb-sm-0'}>
                                <Input type="text"
                                       name="query"
                                       id="query"
                                       placeholder="Search"
                                       value={this.state.query || ''}
                                       onChange={this.onChange}
                                       />
                            </FormGroup>
                        </Col>
                        <Col md={2} sm={4} xs={6} >
                            <Button className='btn'
                                    outline color="primary"
                                    type='submit'
                                    onClick={this.doSearch}>
                                Search
                            </Button>
                        </Col>
                    </Row>
                </Form>

                <div>
                  <div style={{ marginLeft: '40px', fontSize: '12px' }}>
                    {this.state.message}
                  </div>
                </div>
                <div>
                    <SearchResults results={this.state.results}/>
                </div>
            </div>
      </div>
    );
  }

}

// Export component
export default Search;
