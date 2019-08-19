/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.search.advanced-search.advanced-filter
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner James Eckstein <james.eckstein@lmco.com>
 *
 * @author James Eckstein <james.eckstein@lmco.com>
 *
 * @description This renders the advanced element filter option checkboxes.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';
import { Input, Label } from 'reactstrap';

/* eslint-enable no-unused-vars */

function AdvancedFilter(props) {
  return (
    <div key={props.idx} className='adv-filter-item'>
      <Label check>
        <Input type='checkbox'
               name={props.filter}
               className='adv-elem-filters'
               checked={props.checked}
               value={props.checked}
               onChange={(event) => props.filterSelected(props.idx, event)} />
        <div style={{ paddingTop: '3px' }}>
          { props.display }
        </div>
      </Label>
    </div>
  );
}

export default AdvancedFilter;
