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

class SearchResult extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    this.state = {
      collapsed: true
    };

    // Bind component functions
    this.toggleCollapse = this.toggleCollapse.bind(this);
  }

  toggleCollapse() {
    this.setState({collapsed: !this.state.collapsed});
  }


  render() {
    const iconClass = (this.state.collapsed) ? 'fa-chevron-right' : 'fa-chevron-down';
    const icon = (<i className={'fas ' + iconClass}
                         onClick={this.toggleCollapse}/>);

    const element = this.props.data;

    let htmlResult = JSON.stringify(element, null, 4);
    htmlResult = htmlResult.replace(/\n/g, '<br/>');
    htmlResult = htmlResult.replace(/ /g, '&nbsp;');

    /* NOTE:
         *
         *  This isn't really that dangerous since we sanitize all
         *  input on the server side.
         *
         *  ~jdk
         */
    const rawJSONData = (
            <div id={'result-raw-' + element.id} className="search-result-raw">
                <div dangerouslySetInnerHTML={{__html: htmlResult}}/>
            </div>
    );
    return (
            <div className={'search-result'} key={'element-' + element.id}>
                <div className={'search-result-header'}>
                    {icon}
                    <span>{element.name} <small>({element.id})</small></span>
                </div>
                {(this.state.collapsed) ? '' : rawJSONData}
            </div>
    )
  }
}

// Export component
export default SearchResult
