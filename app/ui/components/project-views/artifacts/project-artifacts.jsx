/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.project-views.artifacts.project-artifacts
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author James Eckstein
 *
 * @description This renders a project's artifacts page.
 */


/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */

// React modules
import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalBody, Tooltip, UncontrolledAlert, UncontrolledTooltip } from 'reactstrap';

// MBEE modules
import BoxList from '../../general/box-list.jsx';
import ArtifactListItem from '../../shared-views/list-items/artifact-list-item.jsx';
import List from '../../general/list/list.jsx';
import ArtifactForm from './artifact-form.jsx';
import BranchBar from '../branches/branch-bar.jsx';
import { useApiClient } from '../../context/ApiClientProvider';

/* eslint-enable no-unused-vars */

function ProjectArtifacts(props) {
  const { artifactService } = useApiClient();
  const [artifacts, setArtifacts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedArtifactID, setSelectedArtifactID] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTooltipOpen, setDeleteTooltipOpen] = useState(false);

  const toggleModal = (artifactID) => {
    const id = (typeof artifactID !== 'string') ? null : artifactID;

    setModalOpen((prevState) => !prevState);
    setSelectedArtifactID(id);
  };

  const download = (artifact) => {
    // Reset error state
    if (error) setError(null);

    // URL input variables
    const { location, filename } = artifact;
    const { org, id } = props.project;

    // Base request variables
    const base = `/api/orgs/${org}/projects/${id}/artifacts/blob`;
    const url = `${base}?filename=${filename}&location=${location}`;

    // NOTE: Using XMLHttpRequest in lieu of jQuery AJAX as jQuery does
    // not allow updating response type when headers are received
    const xhr = new XMLHttpRequest();

    // Get artifact blob
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        // Download success
        if (xhr.status === 200) {
          // Download blob, user will be prompted to save.
          const link = document.createElement('a');
          const dataUrl = window.URL.createObjectURL(new Blob([xhr.response]));
          link.href = dataUrl;
          link.setAttribute('download', filename);
          // Append anchor to body.
          document.body.append(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(dataUrl);
        }
        else {
          setError(`[${filename}] ${xhr.responseText}`);
          // Display error response from server
        }
      }
      else if (xhr.readyState === 2) {
        // readyState of '2' indicates headers have been received and response status is available.
        // Update response type based on status
        if (xhr.status === 200) {
          // File exists
          xhr.responseType = 'blob';
        }
        else {
          // No file found. Error response will be 'text'.
          xhr.responseType = 'text';
        }
      }
    };

    xhr.open('GET', url, true);
    xhr.send();
  };

  const refresh = async () => {
    // Base request variables
    const { org, id } = props.project;
    const branchId = props.match.params.branchid;
    const options = {
      includeArchived: true
    };

    // request the artifacts
    const [err, data] = await artifactService.get(org, id, branchId, options);

    // Set the state
    if (err === 'No artifacts found.') setArtifacts([]);
    else if (err) setError(err);
    else if (data) setArtifacts(data);
  };

  const deleteArtifact = async (artifactID) => {
    // Reset error state
    if (error) setError(null);

    // URL input variables
    const orgID = props.project.org;
    const projectID = props.project.id;
    const branchID = props.match.params.branchid;

    const options = {
      ids: artifactID
    };

    // Make the delete request
    const [err, result] = await artifactService.delete(orgID, projectID, branchID, null, options);

    // Set error state or refresh the page
    if (err) setError(err);
    else if (result) refresh();
  };

  const renderArtifacts = (artifactList) => {
    const btnEdit = (props.permissions !== 'read');

    return (
      artifactList.map((artifact, idx) => (
        <div className='user-info' key={`artifact-info-${idx}`}>
          <ArtifactListItem className='branch'
                            artifact={artifact}
                            _key={`artifact-${artifact.id}`}/>
          <div className='controls-container'>
            {/* Display button if user has write or admin permissions */}
            {(btnEdit)
              ? <>
                <UncontrolledTooltip placement='top' target={`edit-${artifact.id}`}>
                  Edit
                </UncontrolledTooltip>
                <i id={`edit-${artifact.id}`}
                   className='fas fa-edit add-btn'
                   onClick={() => toggleModal(artifact.id)}/></>
              : ''
            }
            <UncontrolledTooltip placement='top' target={`download-${artifact.id}`}>
              Download
            </UncontrolledTooltip>
            <i id={`download-${artifact.id}`}
               className='fas fa-file-download download-btn'
               onClick={() => download(artifact)}/>
            {/* Display button if user has write or admin permissions */}
            {(btnEdit)
              ? <>
                <UncontrolledTooltip placement='top' target={`delete-${idx}`}>
                  Delete
                </UncontrolledTooltip>
                <i id={`delete-${idx}`}
                   className='fas fa-trash-alt delete-btn'
                   onClick={() => {
                     // eslint-disable-next-line no-alert
                     if (window.confirm('Are you sure you wish to delete this item?')) deleteArtifact(artifact.id);
                   }}/>
              </>
              : ''
            }
          </div>
        </div>
      ))
    );
  };

  // on mount and when the project or branch changes
  useEffect(() => {
    refresh();
  }, [props.project, props.branchID]);


  // Display first 30 artifacts
  const artifactsList = artifacts.slice(0, 30);
  const artifactItems = (artifactsList.length > 0) ? renderArtifacts(artifactsList) : '';
  const titleClass = 'workspace-title workspace-title-padding';
  const btnCreate = (props.permissions !== 'read')
    ? (<div className='workspace-header-button'>
         <Button className='btn' outline color="primary" onClick={toggleModal}>Create</Button>
       </div>)
    : '';

  // Error alert
  const errorMsg = (error)
    ? (<div style={{ margin: 'auto', textAlign: 'center' }}>
         <UncontrolledAlert color="danger" style={{ display: 'inline', float: 'none' }}>
           {error}
         </UncontrolledAlert>
       </div>)
    : '';

  return (
    <div id='workspace'>
      <Modal isOpen={modalOpen}>
        <ModalBody>
          <ArtifactForm project={props.project}
                        branchId={props.match.params.branchid}
                        artifactId={selectedArtifactID}
                        toggle={toggleModal}
                        refresh={refresh}/>
        </ModalBody>
      </Modal>
      <div className='workspace-header header-box-depth'>
        <h2 className={titleClass}>Artifacts</h2>
        { /* Display create button for privileged users */}
        {btnCreate}
      </div>
      <div id='workspace-body'>
        <div className='main-workspace'>
          <>
            { /* Branch selector */ }
            <div id='artifact-branch-bar'>
              <BranchBar project={props.project}
                         branchid={props.match.params.branchid}
                         endpoint='/artifacts'/>
            </div>
            <BoxList header='Artifacts' footer={{}}>
              <List key='list-artifacts'>
                <div className='template-header' key='user-info-template'>
                  <ArtifactListItem className='head-info'
                                    label={true}
                                    artifact={{
                                      filename: 'Filename',
                                      location: 'Location',
                                      description: 'Description' }}
                                    _key='artifacts-template'/>
                </div>
                {/* Render Artifacts List Items */}
                {artifactItems}
              </List>
            </BoxList>
            {errorMsg}
          </>
        </div>
      </div>
    </div>
  );
}

export default ProjectArtifacts;
