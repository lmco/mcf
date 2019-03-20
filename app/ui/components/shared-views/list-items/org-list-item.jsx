/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.list
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the organization list items.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import StatsList from '../../general/stats/stats-list.jsx';
import Stat from '../../general/stats/stat.jsx';

// Define component
class OrgListItem extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      width: 0
    };

    // Create reference
    this.ref = React.createRef();

    // Bind component functions
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    // Create event listener to resize window
    window.addEventListener('resize', this.handleResize);

    // Set initial size of window
    this.handleResize();
  }

  componentWillUnmount() {
    // Remove event listener on window
    window.removeEventListener('resize', this.handleResize);
  }

  // Define handle resize function
  handleResize() {
    // Set the state prop to the client width
    this.setState({ width: this.ref.current.clientWidth });
  }

  render() {
    // Initialize variables
    const org = this.props.org;

    const stats = (
            // Create the stat list for the organization
            <StatsList>
                <Stat title='Projects' icon='fas fa-boxes' value={org.projects.length} _key={`org-${org.id}-projects`} />
                <Stat title='Users' icon='fas fa-users' value={Object.keys(org.permissions).length} _key={`org-${org.id}-users`} />
            </StatsList>
    );

    // Render the organization stat list items
    return (
                <div className={`stats-list-item ${this.props.className}`} ref={this.ref}>
                    <div className='list-header'>
                        <a href={this.props.href}>{org.name}</a>
                    </div>
                    {/* Verify width of client, remove stats based on width */}
                    {(this.state.width > 600) ? stats : ''}
                </div>
    );
  }

}

// Export component
export default OrgListItem;
