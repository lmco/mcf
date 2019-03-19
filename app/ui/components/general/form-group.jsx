/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a form group.
 */

// React Modules
import React from 'react';
import { FormGroup, Label, Input, FormFeedback } from 'reactstrap';

function GeneralForms(props) {
  return (
    <FormGroup>
      <Label for={props.for}>{props.title}</Label>
      <Input type={props.type}
             name={props.for}
             id={props.for}
             placeholder={props.placeholder}
             value={props.value}
             invalid={props.invalid}
             onChange={props.onChange}/>
      {/* If invalid name, notify user */}
      <FormFeedback >
        {props.formfeedback}
      </FormFeedback>
    </FormGroup>
  );
}

export default GeneralForms;
