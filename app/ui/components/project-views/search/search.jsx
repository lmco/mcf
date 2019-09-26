/**
 * @Classification UNCLASSIFIED
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
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import {
  Input,
  Form,
  FormGroup,
  Button,
  Row,
  Col,
  Spinner
} from 'reactstrap';


// MBEE Modules
import SearchResults from './search-results.jsx';
import AdvancedSearch from './advanced-search/advanced-search.jsx';
import BranchBar from '../branches/branch-bar.jsx';

/* eslint-enable no-unused-vars */

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
      page: 1,
      apiUrl: '',
      message: '',
      searchBtnHidden: false
    };

    // Bind component functions
    this.onChange = this.onChange.bind(this);
    this.doSearch = this.doSearch.bind(this);
    this.getAdvResults = this.getAdvResults.bind(this);
    this.toggleSearchBtn = this.toggleSearchBtn.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
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

  getAdvResults(results, message, apiUrl) {
    this.setState({ results: results, message: message, apiUrl: apiUrl, page: 1 });
  }

  toggleSearchBtn() {
    this.setState((prevState) => ({ searchBtnHidden: !prevState.searchBtnHidden }));
  }

  // Handles prev/next button changes for Search Results
  handlePageChange(results, page) {
    this.setState({ results: results, page: page });
  }

  doSearch(e) {
    // Check if search input is blank or contains whitespace
    const queryInput = this.state.query;
    if (queryInput.length === 0 || !queryInput.trim()) {
      this.setState({ results: null });
      return;
    }

    // Pre-search state resets
    this.setState({
      message: '',
      results: 'Searching ...',
      page: 1
    });

    // Disable form submit
    if (e) {
      e.preventDefault();
    }

    // Append search to URL
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: `?q=${this.state.query}`
    });

    // Build query URL
    const oid = this.props.project.org;
    const pid = this.props.project.id;
    const bid = this.props.match.params.branchid;
    const url = `/api/orgs/${oid}/projects/${pid}/branches/${bid}/elements/search`;

    // Do ajax request
    $.ajax({
      method: 'GET',
      url: `${url}?q=${this.state.query}&limit=11&minified=true`,
      statusCode: {
        401: () => {
          // Refresh when session expires
          window.location.reload();
        }
      }
    })
    .done(data => {
      this.setState({
        results: data,
        apiUrl: `${url}?q=${this.state.query}&limit=11&minified=true`
      });
    })
    .fail(res => {
      if (res.status === 404) {
        this.setState({ results: [] });
      }
    });
  }

  render() {
    // Set style to hide Search button if Advanced Search is toggled
    const style = this.state.searchBtnHidden ? { display: 'none' } : {};
    const options = ['Parent', 'Source', 'Target', 'Type', 'Created By', 'Archived By', 'Last Modified By'];
    // Set search results or loading icons ...
    let searchResults = '';
    if (this.state.results === 'Searching ...') {
      searchResults = (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <Spinner type="grow" color="primary" />
          <span style={{ paddingLeft: '20px' }}>
            Searching ...
          </span>
        </div>
      );
    }
    else if (Array.isArray(this.state.results)) {
      searchResults = (<SearchResults results={this.state.results}
                                      page={this.state.page}
                                      apiUrl={this.state.apiUrl}
                                      handlePageChange={this.handlePageChange}
                                      {...this.props}/>);
    }

    return (
      <div id='view'>
        <div id={'search'}>
          <div id='search-branch-bar'>
            <BranchBar project={this.props.project}
                       branchid={this.props.match.params.branchid}
                       searchForm={true}/>
          </div>
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
                        style={ style }
                        onClick={this.doSearch}>
                    Search
                </Button>
              </Col>
            </Row>
          </Form>
            <AdvancedSearch query={this.state.query || ''}
                            getAdvResults={this.getAdvResults}
                            toggleSearchBtn={this.toggleSearchBtn}
                            options={ options }
                            uri={this.state.uri}
                            {...this.props}/>
            <div>
              <div id='search-message'>
                {this.state.message}
              </div>
            </div>
            <div>
              {searchResults}
            </div>
        </div>
      </div>
    );
  }

}

// Export component
export default Search;
