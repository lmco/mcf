/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.general.stats.stat
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a stat.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';
import { UncontrolledTooltip } from 'reactstrap';

// Define component
class Stat extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Create reference
    this.ref = React.createRef();
  }

  componentDidMount() {
    // Set the child width and title of the parent props
    this.props.setChildWidth(this.props.title, this.ref.current.clientWidth);
  }

  render() {
    // Return stats
    return (
      // Create stat div with key or title
      <div className='stats-item' ref={this.ref} id={this.props._key || this.props.title}>
        <i className={this.props.icon}/>
        {/* If prop value does not exist, display a '?' */}
        <p>{Number.isNaN(this.props.value) ? '?' : this.props.value}</p>
        {/* Create hover title for icon */}
        <UncontrolledTooltip placement='top'
                             target={this.props._key || this.props.title}
                             delay={{ show: 0, hide: 0 }}
                             boundariesElement='viewport'>
          {this.props.title}
        </UncontrolledTooltip>
      </div>
    );
  }

}

// Export component
export default Stat;
