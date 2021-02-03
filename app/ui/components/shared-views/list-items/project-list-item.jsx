/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.shared-views.list-items.project-list-item
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 * @author Jake Ursetta
 *
 * @description This renders the project list items.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

// MBEE modules
import StatsList from '../../general/stats/stats-list.jsx';
import Stat from '../../general/stats/stat.jsx';

/* eslint-enable no-unused-vars */

// Define component
class ProjectListItem extends Component {

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
    // Event listener of the size of the window
    window.addEventListener('resize', this.handleResize);

    // Call function on resize of window
    this.handleResize();
  }

  componentWillUnmount() {
    // Remove event listener on the window
    window.removeEventListener('resize', this.handleResize);
  }

  // Define handle size function
  handleResize() {
    // Set the state prop to the client width
    this.setState({ width: this.ref.current.clientWidth });
  }

  render() {
    // Initialize variables
    const project = this.props.project;
    let colorClass;

    // Verify if archived
    if (project.archived || this.props.archiveProj) {
      // Gray-out the name
      colorClass = 'archived-link';
    }

    const stats = (
      // Create the stat list for the organization
      <StatsList>
        <Stat title='Users'
              className={colorClass}
              icon='fas fa-users'
              value={Object.keys(project.permissions).length}
              _key={`project-${project.id.split(':').join('-')}-users`} />
        {(!this.props.divider)
          ? <Stat title='' icon='' value='' _key='empty'/>
          : <Stat divider={this.props.divider} _key={`project-${project.id}-divider`}/>
        }
      </StatsList>
    );

    // Render the organization stat list items
    return (
      <div className={`stats-list-item ${this.props.className}`} ref={this.ref}>
        <div className='list-header'>
          <Link className={colorClass} to={this.props.link}>{project.name}</Link>
        </div>
        {/* Verify width of client, remove stats based on width */}
        {(this.state.width > 600) ? stats : ''}
      </div>
    );
  }

}

// Export component
export default ProjectListItem;
