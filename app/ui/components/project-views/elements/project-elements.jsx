/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.project-elements
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This renders a project's element page.
 */

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';
import { Button } from 'reactstrap';

// MBEE Modules
import ElementTree from './element-tree.jsx';
import Element from './element.jsx';
import ElementEdit from './element-edit.jsx';
import ElementNew from './element-new.jsx';
import SidePanel from '../../general/side-panel.jsx';

// Define component
class ProjectElements extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    this.state = {
      sidePanel: false,
      id: null,
      refreshFunction: null
    };

    this.openElementInfo = this.openElementInfo.bind(this);
    this.closeSidePanel = this.closeSidePanel.bind(this);
    this.editElementInfo = this.editElementInfo.bind(this);
    this.createNewElement = this.createNewElement.bind(this);
  }


  createNewElement() {
    this.setState({
      sidePanel: 'addElement'
    });

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  }

  // Define the open and close of the element side panel function
  openElementInfo(id, refreshFunction) {
    // The currently selected element
    this.setState({ id: id, refreshFunction: refreshFunction });

    // Select the clicked element
    $('.element-tree').removeClass('tree-selected');
    $(`#tree-${id}`).addClass('tree-selected');

    if (this.state.sidePanel === 'addElement') {
      // do nothing
    }
    else {
      // Toggle the element side panel
      this.setState({ sidePanel: 'elementInfo' });
    }

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  }

  closeSidePanel(event, refresh, isDelete) {
    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.remove('side-panel-expanded');

    this.setState({ sidePanel: null });

    if (refresh) {
      this.state.refreshFunction(isDelete);
    }
  }

  editElementInfo() {
    this.setState({
      sidePanel: 'elementEdit'
    });

    // Get the sidebar html element and toggle it
    document.getElementById('side-panel').classList.add('side-panel-expanded');
  }

  componentDidMount() {

  }

  render() {
    let sidePanelView = <Element id={this.state.id}
                                 project={this.props.project}
                                 url={this.props.url}
                                 editElementInfo={this.editElementInfo}
                                 closeSidePanel={this.closeSidePanel}/>;

    if (this.state.sidePanel === 'elementEdit') {
      sidePanelView = <ElementEdit id={this.state.id}
                                   url={this.props.url}
                                   openElementInfo={this.openElementInfo}
                                   closeSidePanel={this.closeSidePanel}/>;
    }

    else if (this.state.sidePanel === 'addElement') {
      sidePanelView = (<ElementNew id={'new-element'}
                                   parent={this.state.id}
                                   project={this.props.project}
                                   closeSidePanel={this.closeSidePanel}
                                   url={this.props.url}/>);
    }

    // Return element list
    return (
      <React.Fragment>
        <div id='workspace'>
          <div id='workspace-header' className='workspace-header'>
            <h2 className='workspace-title'>{this.props.project.name} Model</h2>
            <div id='workspace-header-btn' className='workspace-header-button ws-button-group'>
              <Button className='btn btn-sm'
                      outline color='primary'
                      onClick={this.createNewElement}>
                <i className='fas fa-plus'/>
                Add Element
              </Button>
            </div>
          </div>
          <div id='workspace-body'>
            <div id='element-tree-container' className='main-workspace'>
              <ElementTree id='model'
                           project={this.props.project}
                           parent={null}
                           isOpen={true}
                           parentRefresh={this.componentDidMount}
                           clickHandler={this.openElementInfo}/>
            </div>
            <SidePanel>
              { sidePanelView }
            </SidePanel>
          </div>
        </div>
      </React.Fragment>
    );
  }

}

// Export component
export default ProjectElements;
