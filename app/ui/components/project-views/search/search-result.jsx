/**
 * @Classification UNCLASSIFIED
 *
 * @module ui.components.project-views.search.search-result
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner James Eckstein <james.eckstein@lmco.com>
 *
 * @author James Eckstein <james.eckstein@lmco.com>
 *
 * @description This renders the search result columns for the results table.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

import React from 'react';

/* eslint-enable no-unused-vars */

function SearchResult(props) {
  const cols = [];

  props.keys.forEach((key, index) => {
    // Check if element has value defined for respective key
    const currentValue = (typeof props.data[key] === 'undefined') ? '' : props.data[key].toString();
    // Convert Custom data to string
    const displayValue = (key === 'custom') ? JSON.stringify(props.data[key]) : currentValue;

    cols.push(
      <td key={`row-${index}`}>{displayValue}</td>
    );
  });

  return cols;
}


// Export component
export default SearchResult;
