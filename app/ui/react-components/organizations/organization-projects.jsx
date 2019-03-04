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
 * @description This renders an organization's projects list.
 */

// React Modules
import React from 'react';

// MBEE Modules
import ListItem from '../general-components/list/list-item.jsx';
import List from '../general-components/list/list.jsx';
import { Button, Modal, ModalBody } from 'reactstrap';
import CreateProject from '../projects/project-create.jsx';

// Define function
function OrganizationProjects(props) {
    // Initialize variables
    const org = props.org;

    // Loop through the org's projects
    const listItems = org.projects.map(project =>
        // Create the project list item
        <ListItem href={`/${org.id}/${project.id}`}> {project.name} </ListItem>
    );

    // Return the org's project list
    return (
        <React.Fragment>
            <div>
                <Modal isOpen={props.modal} toggle={props.handleToggle}>
                    <ModalBody>
                        {(props.write) ? <CreateProject org={org}/> : '' }
                    </ModalBody>
                </Modal>
            </div>
            <div id='view' className='org-projects'>
                <div className='project-list-header'>
                     <h2 className='project-header'>Projects</h2>
                    {(!props.write)
                        ? ''
                        :(<div className='project-button'>
                            <Button className='btn'
                                    outline color="secondary"
                                    onClick={props.handleToggle}>
                                Create
                            </Button>
                         </div>)
                    }
                </div>
                <hr />
                <List>
                    {listItems}
                </List>
            </div>
        </React.Fragment>
    )
}

// Export function
export default OrganizationProjects
