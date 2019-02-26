/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.organizations
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
 * @description This renders the organizations list.
 */

// React Modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

// MBEE Modules
import List from '../general-components/list/list.jsx';
import OrgListItem from '../general-components/list/org-list-item.jsx';
import { getRequest } from '../helper-functions/getRequest';

// Define component
class OrganizationList extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            width: null,
            orgs: []
        };

        // Create reference
        this.ref = React.createRef();

        // Bind component functions
        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
        // Get orgs user has permissions on with their projects
        getRequest('/api/orgs?populate=projects')
        .then(orgs => {
            // Put orgs in state props
            this.setState({ orgs: orgs });
        })
        // Throw error
        .catch(err => console.log(err));

        // Add event listener for window resizing
        window.addEventListener('resize', this.handleResize);

        // Set initial size of window
        this.handleResize();
    }

    componentWillUnmount() {
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        // Set state to width of window
        this.setState({ width: this.ref.current.clientWidth })
    }

    render() {
        // Loop through all the orgs
        const orgs = this.state.orgs.map(org =>
            // Create org links
            <Link to={`/${org.id}`}>
                <OrgListItem org={org}/>
            </Link>
        );

        // Return org list
        return (
            <div id='view' className='org-list' ref={this.ref}>
                <h2>Your Organizations</h2>
                <hr/>
                {/*Verify if there are orgs*/}
                {(this.state.orgs.length === 0)
                    ? (<div className='list-item'>
                        <h3> No organizations. </h3>
                    </div>)
                    // Display org list
                    : (<List>
                        {orgs}
                    </List>)
                }
            </div>
        )
    }
}

// Export component
export default OrganizationList
