/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.search.advanced-search.advanced-row
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner James Eckstein <james.eckstein@lmco.com>
 *
 * @author James Eckstein <james.eckstein@lmco.com>
 *
 * @description This renders an advanced search row.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';
import { Button, Col, Input, InputGroup } from 'reactstrap';

/* eslint-enable no-unused-vars */

function AdvancedRow(props) {
  // Show delete button if there's more than 1 row
  const btnDeleteRow = (props.idx !== 0)
    ? <Button close className='adv-row-del' onClick={() => props.deleteRow(props.idx)}/>
    : <Button close className='adv-row-del' disabled={true} style={ { color: 'transparent' } }/>;

  return (
    <div key={props.idx} className='adv-search-row'>
      <InputGroup className='adv-search-input-group'>
        <Col className='adv-col' md={3}>
          <Input type='select' name='criteria'
                 className='adv-search-select'
                 value={props.criteria}
                 onChange={(event) => props.handleChange(props.idx, event)}>
            {props.options }
          </Input>
        </Col>
        <Input placeholder={props.criteria}
               className='adv-input-field'
               name='value'
               value={props.val}
               onChange={(event) => props.handleChange(props.idx, event)}>
        </Input>
        { btnDeleteRow }
      </InputGroup>
    </div>
  );
}

export default AdvancedRow;
