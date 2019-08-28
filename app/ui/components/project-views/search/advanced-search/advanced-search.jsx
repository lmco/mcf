/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.search.advanced-search.advanced-search
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner James Eckstein <james.eckstein@lmco.com>
 *
 * @author James Eckstein <james.eckstein@lmco.com>
 *
 * @description This renders the advanced search form.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';
import {
  Button,
  Card,
  CardBody,
  Row,
  Col,
  Collapse,
  DropdownMenu,
  DropdownToggle,
  Form,
  FormGroup,
  Input,
  InputGroup,
  Label,
  UncontrolledButtonDropdown
} from 'reactstrap';

// Import MBEE Modules
import AdvancedRow from './advanced-row.jsx';
import AdvancedFilter from './advanced-filter.jsx';

/* eslint-enable no-unused-vars */

class AdvancedSearch extends Component {

  constructor(props) {
    super(props);

    const rows = [];
    const params = this.props.location.search.slice(1) || null;
    const filters = {
      archivedBy: false,
      archivedOn: false,
      branch: false,
      createdBy: false,
      createdOn: false,
      custom: false,
      documentation: false,
      lastModifiedBy: false,
      name: false,
      org: false,
      parent: false,
      project: false,
      source: false,
      target: false,
      type: false,
      updatedOn: false
    };

    // Parse URL parameters
    if (params) {
      params.split('&').forEach(pair => {
        const [param, value] = pair.split('=');
        // Update element filter checkbox values for specified fields
        if (param === 'fields') {
          // Decode commas in fields
          const fields = decodeURIComponent(value).split(',');
          // Update selected fields to true
          fields.forEach(field => {
            filters[field] = true;
          });
        }
        else if (param !== 'q') {
          // Add the parameter to rows to be rendered.
          rows.push({
            // eslint-disable-next-line no-undef
            criteria: convertCase(param, 'proper'),
            value: decodeURIComponent(value)
          });
        }
      });
    }

    // Set rows default value if there are no URL parameters.
    if (Object.keys(rows).length === 0) {
      // Get the first option passed from the Parent Component.
      // eslint-disable-next-line no-undef
      const option = convertCase(this.props.options[0], 'api');
      rows[option] = '';
    }

    this.state = {
      rows: (rows.length === 0) ? [{ criteria: this.props.options[0], value: '' }] : rows,
      query: params || '',
      results: null,
      message: '',
      collapse: (rows.length > 0) || false,
      currentFilters: filters
    };

    this.toggle = this.toggle.bind(this);
    this.addRow = this.addRow.bind(this);
    this.removeRow = this.removeRow.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.filterSelected = this.filterSelected.bind(this);
  }

  // Unhide/hide Search button if toggled
  toggle() {
    this.setState((prevState) => ({ collapse: !prevState.collapse }));
    this.props.toggleSearchBtn();
  }

  addRow() {
    this.setState((prevState) => ({
      rows: [...prevState.rows, { criteria: this.props.options[0], value: '' }]
    }));
  }

  removeRow(i) {
    const rows = this.state.rows;
    rows.splice(i, 1);
    this.setState({ rows: rows });
  }

  handleChange(i, event) {
    const { name, value } = event.target;
    const rows = this.state.rows;
    rows[i][name] = value;
    this.setState({ rows: rows });
  }

  // Update state for selected filter checkbox
  filterSelected(i, event) {
    const filter = event.target.name;
    const currentFilters = this.state.currentFilters;
    currentFilters[filter] = !this.state.currentFilters[filter];
    this.setState({ currentFilters: currentFilters });
  }

  // Generate query string and display corresponding results
  doAdvSearch(e) {
    // Pre-search state resets
    this.props.getAdvResults([], 'Searching...');

    // Disable form submit
    if (e) {
      e.preventDefault();
    }

    const duplicateCriteria = [];
    const params = {};
    const rows = this.state.rows;

    // Place Advanced Search Input into Param object
    rows.forEach(function(row) {
      // Remove spaces and ensure first letter is lowercase
      const criteriaInput = (row.criteria).replace(/\s/g, '');
      const criteria = criteriaInput.charAt(0).toLowerCase() + criteriaInput.slice(1);
      // Get first string from input field
      const val = (row.value).trim().split(' ')[0];

      // Check if duplicate criteria entered
      if (!(duplicateCriteria.includes(criteria)) && (val.length > 0)) {
        duplicateCriteria.push(criteria);

        // Add to params object
        params[criteria] = encodeURIComponent(val);
      }
    });

    // Get project information
    const oid = this.props.project.org;
    const pid = this.props.project.id;
    const bid = this.props.match.params.branchid;
    // Check for Basic Search input
    const basicQuery = ((this.props.query).trim().length > 0) ? this.props.query : null;
    // Check for Advanced Search input
    let queryStr = (Object.entries(params).length > 0)
      ? Object.keys(params).map(key => key.concat('=', params[key])).join('&') : null;
    // Build URL
    const url = (basicQuery)
      ? `/api/orgs/${oid}/projects/${pid}/branches/${bid}/elements/search`
      : `/api/orgs/${oid}/projects/${pid}/branches/${bid}/elements`;

    // Cases for Search input:
    //  1 - Basic and Advanced search criteria entered
    //  2 - Advanced search criteria entered
    //  3 - Basic search criteria entered
    //  4 - No input (Do Nothing)
    if ((basicQuery) && (queryStr)) {
      queryStr = `?q=${this.props.query}&${queryStr}`;
    }
    else if (queryStr) {
      queryStr = `?${queryStr}`;
    }
    else if (basicQuery) {
      queryStr = `?q=${this.props.query}`;
    }
    else {
      this.setState({ results: [] });
      this.props.getAdvResults([], '');
      return;
    }

    // Create array of selected/checked filters
    const filters = this.state.currentFilters;
    const selectedFilters = Object.keys(filters).filter(field => (filters[field]));

    // If filters are selected, add them to query string
    if (selectedFilters.length > 0) {
      // Append to query string
      queryStr = `${queryStr}&fields=${selectedFilters.join()}`;
    }

    // Append search to URL
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: queryStr
    });

    // Setup request to API endpoint with query
    this.setState({
      query: queryStr
    }, () => {
      // Do ajax request
      const start = new Date();
      $.ajax({
        method: 'GET',
        // TODO: Discuss paginating search results. Limit to 100 results.
        url: `${url}${this.state.query}&limit=100&minified=true`,
        statusCode: {
          401: () => {
            // Refresh when session expires
            window.location.reload();
          }
        }
      })
      .done(data => {
        const end = new Date();
        const elapsed = (end - start) / 1000;

        this.setState({
          results: data,
          message: `Got ${data.length} results in ${elapsed} seconds.`
        }, () => {
          // Re-render page with search results
          this.props.getAdvResults(this.state.results, this.state.message);
        });
      })
      .fail(res => {
        if (res.status === 404) {
          this.setState({ results: [] });
          // Re-render page to display no results found
          this.props.getAdvResults([], '');
        }
      });
    });
  }

  // Generate JSX for advanced rows
  createRowUI() {
    const opt = this.props.options;
    const options = opt.map((option, i) => <option key={i} value={option}> {option} </option>);
    return this.state.rows.map((row, id) => (
      <AdvancedRow idx={id} key={id}
                   criteria={row.criteria || opt[0]}
                   val={row.value}
                   options={ options }
                   handleChange={this.handleChange}
                   deleteRow={this.removeRow}/>
    ));
  }

  // Generate JSX for element filter options
  createFilters() {
    // Get current filters
    const currentFilters = this.state.currentFilters;
    // Array for advanced filter components;
    const filters = [];

    // Iterate through filters and build components
    Object.keys(currentFilters).forEach((filter, id) => {
      // Build filter checkbox component
      filters.push(
        <AdvancedFilter key={`adv-option-key-${id}`}
                      idx={id}
                      filter={filter}
                      /* eslint-disable-next-line no-undef */
                      display={convertCase(filter, 'proper')}
                      checked={currentFilters[filter]}
                      filterSelected={this.filterSelected}

        />
      );
    });

    return filters;
  }

  componentDidMount() {
    // Hide Search button if Advanced Search is toggled
    if (this.state.collapse) {
      this.props.toggleSearchBtn();
    }
    // Perform API call if user has entered search terms into the URL
    if (this.state.query) {
      this.doAdvSearch();
    }
  }

  render() {
    const rows = this.state.rows;
    const options = this.props.options;

    // Limit adding rows to number of options.
    const btnAddRow = (Object.keys(rows).length < options.length)
      ? <Button id='btn-add-adv-row' type='button' onClick={this.addRow.bind(this)}>+ Add Row</Button>
      : null;

    // Create array of Advanced Filter components
    const filterCols = this.createFilters();

    return (
      <div className='adv-search'>
        <Button id='btn-adv-search-toggle'
                onClick={this.toggle}>
                Advanced
        </Button>
        <Collapse isOpen={this.state.collapse}>
          <Col className='adv-col' sm={10}>
            <Card id='adv-card'>
              <CardBody id='adv-card-body'>
                { /* Advanced Search Header Label and Element Filter */ }
                <FormGroup row id='adv-search-header' >
                  <h5 id='frm-adv-label'>Advanced Search</h5>
                  <div id='adv-filter-btn'>
                    <UncontrolledButtonDropdown>
                      <DropdownToggle close
                                      id='adv-filter-toggle'
                                      aria-label='Filter Results'
                                      size='sm'>
                        <span>
                          <i className='fas fa-ellipsis-v' style={{ fontSize: '15px' }}/>
                        </span>
                      </DropdownToggle>
                      <DropdownMenu right className='multi-column' id='filter-menu' sm={12}>
                        { /* Create checkbox options for element filters */ }
                        { /* Divide elements into columns of '6, 5, 6' filters */ }
                        <Row>
                          <Label id='adv-filter-label' style={{ fontSize: '14px' }}>
                            Element Filters
                          </Label>
                        </Row>
                        <hr id='adv-filter-separator' />
                        <Row id='adv-filter-frm'>
                            <Col sm={4} className='adv-filter-col'>
                              { filterCols.slice(0, 6) }
                            </Col>
                            <Col sm={4} className='adv-filter-col'>
                              { filterCols.slice(6, 11) }
                            </Col>
                            <Col sm={4} className='adv-filter-col'>
                              { filterCols.slice(11, 16) }
                            </Col>
                        </Row>
                      </DropdownMenu>
                    </UncontrolledButtonDropdown>
                  </div>
                </FormGroup>
                <hr id='adv-separator' />
                { /* Input Rows for Search Criteria */ }
                <Form id='adv-search-form'>
                  { this.createRowUI() }
                  <InputGroup id='adv-btns-grp' className='adv-search-row'>
                    <Col className='adv-col' md={3}>
                      { btnAddRow }
                    </Col>
                    <Button id='btn-adv-search'
                            outline color='primary'
                            type='submit'
                            onClick={this.doAdvSearch.bind(this)}>
                            Search
                    </Button>
                  </InputGroup>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Collapse>
      </div>
    );
  }

}

export default AdvancedSearch;
