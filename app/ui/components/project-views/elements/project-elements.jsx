/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.project-elements
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description This renders a project's element page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Button } from 'reactstrap';

// MBEE modules
import ElementTree from './element-tree.jsx';
import Element from './element.jsx';
import ElementEdit from './element-edit.jsx';
import ElementNew from './element-new.jsx';
import SidePanel from '../../general/side-panel.jsx';
import BranchBar from '../branches/branch-bar.jsx';

/* eslint-enable no-unused-vars */

// Define component
class ProjectElements extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    this.state = {
      sidePanel: false,
      id: null,
      refreshFunction: {},
      branch: props.match.params.branchid,
      archived: false,
      displayIds: true,
      expand: false,
      collapse: false,
      error: null
    };

    this.setRefreshFunctions = this.setRefreshFunctions.bind(this);
    this.openElementInfo = this.openElementInfo.bind(this);
    this.closeSidePanel = this.closeSidePanel.bind(this);
    this.editElementInfo = this.editElementInfo.bind(this);
    this.createNewElement = this.createNewElement.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
    this.unsetCheckbox = this.unsetCheckbox.bind(this);
  }

  setRefreshFunctions(id, refreshFunction) {
    this.state.refreshFunction[id] = refreshFunction;
  }

  createNewElement() {
    this.setState({
      sidePanel: 'addElement'
    });

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  }

  // Define the open and close of the element side panel function
  openElementInfo(id) {
    // Select the clicked element
    $('.element-tree').removeClass('tree-selected');
    $(`#tree-${id}`).addClass('tree-selected');

    if (this.state.sidePanel === 'addElement') {
      // Only set the refresh function
      // The ID is not set here to avoid updating the 'parent' field on the
      // add element panel. That parent field should only be passed in when
      // the addElement panel is first opened.
    }
    else {
      // Toggle the element side panel
      this.setState({
        id: id,
        sidePanel: 'elementInfo'
      });
    }

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  }

  closeSidePanel(event, refreshIDs) {
    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.remove('side-panel-expanded');

    this.setState({ sidePanel: null });

    if (refreshIDs) {
      refreshIDs.forEach((id) => {
        if (this.state.refreshFunction.hasOwnProperty(id)) {
          this.state.refreshFunction[id]();
        }
      });
    }
  }

  editElementInfo() {
    this.setState({
      sidePanel: 'elementEdit'
    });

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  }

  handleCheck(event) {
    const checkbox = event.target.name;
    // Set new state to opposite of previous value
    const newState = { [checkbox]: !this.state[checkbox] };

    // Set collapse to false if expand is checked and vice versa
    if (checkbox === 'expand') {
      newState.collapse = false;
    }
    else if (checkbox === 'collapse') {
      newState.expand = false;
    }

    // Update state with checkbox values
    this.setState(newState);
  }

  unsetCheckbox() {
    this.setState({
      collapse: false,
      expand: false
    });
  }

  componentDidMount() {
    if (this.props.location.hash) {
      const elementid = this.props.location.hash.replace('#', '');
      this.openElementInfo(elementid);
    }
  }

  render() {
    let isButtonDisplayed = false;
    let btnDisClassName = 'workspace-title workspace-title-padding';
    const orgId = this.props.project.org;
    const projId = this.props.project.id;
    const branchId = this.state.branch;
    const url = `/api/orgs/${orgId}/projects/${projId}/branches/${branchId}`;

    // Check admin/write permissions
    if (this.props.permissions === 'admin' || this.props.permissions === 'write') {
      isButtonDisplayed = true;
      btnDisClassName = 'workspace-title';
    }

    let sidePanelView = <Element id={this.state.id}
                                 project={this.props.project}
                                 branch={this.state.branch}
                                 url={url}
                                 permissions={this.props.permissions}
                                 editElementInfo={this.editElementInfo}
                                 closeSidePanel={this.closeSidePanel}/>;

    if (this.state.sidePanel === 'elementEdit') {
      sidePanelView = <ElementEdit id={this.state.id}
                                   url={url}
                                   project={this.props.project}
                                   branch={this.state.branch}
                                   closeSidePanel={this.closeSidePanel}
                                   selected={this.state.selected}/>;
    }

    else if (this.state.sidePanel === 'addElement') {
      sidePanelView = (<ElementNew id={'new-element'}
                                   parent={this.state.id}
                                   branch={this.state.branch}
                                   project={this.props.project}
                                   closeSidePanel={this.closeSidePanel}
                                   url={url}/>);
    }

    // Return element list
    return (
      <div id='workspace'>
        <div className='workspace-header header-box-depth'>
          <h2 className={btnDisClassName}>{this.props.project.name} Model</h2>
          {(!isButtonDisplayed)
            ? ''
            : (<div className='workspace-header-button ws-button-group add-elements-btn'>
              <Button className='bigger-width-btn btn-sm'
                      outline color='primary'
                      onClick={this.createNewElement}>
                <i className='fas fa-plus'/>
                Add Element
              </Button>
            </div>)}
        </div>
        <div id='workspace-body'>
          <div className='main-workspace'>
            <BranchBar project={this.props.project}
                       branchid={this.state.branch}
                       archived={this.state.archived}
                       permissions={this.props.permissions}
                       displayIds={this.state.displayIds}
                       expand={this.state.expand}
                       collapse={this.state.collapse}
                       handleCheck={this.handleCheck}/>
            <ElementTree project={this.props.project}
                         branch={this.state.branch}
                         linkElements={true}
                         archived={this.state.archived}
                         displayIds={this.state.displayIds}
                         expand={this.state.expand}
                         collapse={this.state.collapse}
                         unsetCheckbox={this.unsetCheckbox}
                         handleCheck={this.handleCheck}
                         setRefreshFunctions={this.setRefreshFunctions}
                         clickHandler={this.openElementInfo}/>
          </div>
          <SidePanel>
            { sidePanelView }
          </SidePanel>
        </div>
      </div>
    );
  }

}

// Export component
export default ProjectElements;
