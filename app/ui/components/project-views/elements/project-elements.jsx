/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.project-elements
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 * @author Josh Kaplan
 *
 * @description This renders a project's element page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalBody } from 'reactstrap';

// MBEE modules
import ElementTree from './element-tree.jsx';
import Element from './element.jsx';
import ElementNew from './element-new.jsx';
import SidePanel from '../../general/side-panel.jsx';
import BranchBar from '../branches/branch-bar.jsx';
import ElementEditForm from './element-edit-form.jsx';
import { useElementContext } from './ElementContext.js';

/* eslint-enable no-unused-vars */

/**
 * @description The Project Elements component.
 *
 * @param {object} props - React props.
 * @returns {Function} - Returns JSX.
 */
export default function ProjectElements(props) {
  const [state, setState] = useState({
    refreshFunction: {},
    branch: props.match.params.branchid,
    archived: false,
    displayIds: true,
    expand: false,
    collapse: false,
    error: null,
    modalOpen: false
  });
  const [sidePanel, setSidePanel] = useState(false);

  const { elementID, setElementID } = useElementContext();

  const setRefreshFunctions = (id, refreshFunction) => {
    setState((currentState) => {
      currentState.refreshFunction[id] = refreshFunction;
      return currentState;
    });
  };

  const createNewElement = () => {
    setSidePanel('addElement');

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  };

  // Define the open and close of the element side panel function
  const openElementInfo = (id) => {
    // Select the clicked element
    $('.element-tree').removeClass('tree-selected');
    $(`#tree-${id}`).addClass('tree-selected');

    // Toggle the element side panel
    setElementID(id);
    setSidePanel('elementInfo');

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  };

  const closeSidePanel = (event, refreshIDs) => {
    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.remove('side-panel-expanded');

    setSidePanel(null);

    if (refreshIDs) {
      refreshIDs.forEach((id) => {
        if (state.refreshFunction.hasOwnProperty(id)) {
          state.refreshFunction[id]();
        }
      });
    }
  };

  const editElementInfo = () => {
    setSidePanel('elementEdit');

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  };

  const handleCheck = (event) => {
    const checkbox = event.target.name;

    setState((currentState) => {
      // Set new state to opposite of previous value
      currentState[checkbox] = !currentState[checkbox];

      // Set collapse to false if expand is checked and vice versa
      if (checkbox === 'expand') {
        currentState.collapse = false;
      }
      else if (checkbox === 'collapse') {
        currentState.expand = false;
      }
      return currentState;
    });
  };

  const unsetCheckbox = () => {
    setState((currentState) => {
      currentState.collapse = false;
      currentState.expand = false;
      return currentState;
    });
  };

  const toggleModal = () => {
    setState((currentState) => {
      currentState.modalOpen = !currentState.modalOpen;
      return currentState;
    });
  };

  useEffect(() => {
    if (props.location.hash) {
      const elementid = props.location.hash.replace('#', '');
      openElementInfo(elementid);
    }
  }, []);


  let isButtonDisplayed = false;
  let btnDisClassName = 'workspace-title workspace-title-padding';
  const orgId = props.project.org;
  const projId = props.project.id;
  const branchId = state.branch;
  const url = `/api/orgs/${orgId}/projects/${projId}/branches/${branchId}`;

  // Check admin/write permissions
  if (props.permissions === 'admin' || props.permissions === 'write') {
    isButtonDisplayed = true;
    btnDisClassName = 'workspace-title';
  }

  let sidePanelView = <Element project={props.project}
                               branch={state.branch}
                               url={url}
                               permissions={props.permissions}
                               editElementInfo={editElementInfo}
                               closeSidePanel={closeSidePanel}
                               toggle={toggleModal}/>;

  if (sidePanel === 'elementEdit') {
    // TODO: have this component pull elementID from Provider
    sidePanelView = <ElementEditForm id={elementID}
                                 url={url}
                                 project={props.project}
                                 branch={state.branch}
                                 closeSidePanel={closeSidePanel}
                                 selected={state.selected}/>;
  }

  else if (sidePanel === 'addElement') {
    sidePanelView = (<ElementNew id={'new-element'}
                                 parent={elementID}
                                 branch={state.branch}
                                 project={props.project}
                                 closeSidePanel={closeSidePanel}
                                 url={url}/>);
  }

  // Return element list
  return (
    <div id='workspace'>
      <Modal isOpen={state.modalOpen}>
        <ModalBody>
          <ElementEditForm id={elementID}
                           toggle={toggleModal}
                           modal={state.modalOpen}
                           customData={props.project.custom}
                           archived={props.project.archived}
                           url={url}
                           project={props.project}
                           branch={state.branch}
                           closeSidePanel={closeSidePanel}>
          </ElementEditForm>
        </ModalBody>
      </Modal>
      <div className='workspace-header header-box-depth'>
        <h2 className={btnDisClassName}>{props.project.name} Model</h2>
        {(!isButtonDisplayed)
          ? ''
          : (<div className='workspace-header-button ws-button-group add-elements-btn'>
            <Button className='bigger-width-btn btn-sm'
                    outline color='primary'
                    onClick={createNewElement}>
              <i className='fas fa-plus'/>
              Add Element
            </Button>
          </div>)}
      </div>
      <div id='workspace-body'>
        <div className='main-workspace'>
          <BranchBar project={props.project}
                     branchid={state.branch}
                     archived={state.archived}
                     endpoint='/elements'
                     permissions={props.permissions}
                     displayIds={state.displayIds}
                     expand={state.expand}
                     collapse={state.collapse}
                     handleCheck={handleCheck}/>
          <ElementTree project={props.project}
                       branch={state.branch}
                       linkElements={true}
                       archived={state.archived}
                       displayIds={state.displayIds}
                       expand={state.expand}
                       collapse={state.collapse}
                       unsetCheckbox={unsetCheckbox}
                       handleCheck={handleCheck}
                       setRefreshFunctions={setRefreshFunctions}
                       clickHandler={openElementInfo}/>
        </div>
        <SidePanel>
          { sidePanelView }
        </SidePanel>
      </div>
    </div>
  );
}
