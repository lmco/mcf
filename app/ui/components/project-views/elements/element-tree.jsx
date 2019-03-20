/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.elements
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
 * @description This renders the element tree in the project's page.
 */

// React Modules
import React, { Component } from 'react';
import { Label } from 'reactstrap';

// Define component
class ElementTree extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    this.state = {
      id: props.id,
      isOpen: props.isOpen,
      data: null,
      modalEdit: false,
      elementWindow: false
    };

    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.handleEditToggle = this.handleEditToggle.bind(this);
    this.handleElementToggle = this.handleElementToggle.bind(this);
  }

  handleEditToggle() {
    this.setState({ modalEdit: !this.state.modalEdit });
  }

  handleElementToggle() {
    this.setState({ elementWindow: !this.state.elementWindow });
  }

  componentDidMount() {
    // Build URL to get element data
    const orgId = this.props.project.org;
    const projId = this.props.project.id;
    let base = `/api/orgs/${orgId}/projects/${projId}/branches/master`;
    let url = `${base}/elements/${this.props.id}?fields=id,name,contains,type`;

    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (data) => { this.setState({ data: data }); },
        401: (data) => { this.setState({ data: null }); }
      },
      fail: () => {
        console.log('A failure occurred.');
      }
    });
  }

  toggleCollapse() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  // Create the element tree list
  render() {
    // Initialize variables
    let elementIcon = (
      <i className={'fas fa-cube'}
         style={{color: '#333'}}></i>
    );
    let expandIcon = 'fa-caret-right transparent';
    let subtree = [];

    // If the element contains other elements, handle the subtree
    if (this.state.data !== null
            && Array.isArray(this.state.data.contains)
            && this.state.data.contains.length >= 1) {

      // Icon should be chevron to show subtree is collapsible
      expandIcon = (this.state.isOpen) ? 'fa-caret-down' : 'fa-caret-right';


      // Create Subtrees
      for (let i = 0; i < this.state.data.contains.length; i++) {
        subtree.push(
                    <ElementTree key={`tree-${this.state.data.contains[i]}`}
                                 id={`tree-${this.state.data.contains[i]}`}
                                 project={this.props.project}
                                 parent={this.state}
                                 onClick={this.props.onClick}
                                 isOpen={false}/>
        );
      }
    }



    // Build the rendered element item
    let element = '';
    if (this.state.data !== null) {
      // Element should be rendered as the ID initially
      element = (
        <span className={'element-id'} onClick={this.handleEditToggle}>
           {this.state.data.id} : {this.state.data.type}
        </span>
      );
      // If the name is not blank, render the name
      if (this.state.data.name !== '') {
        element = (
          <span onClick={this.handleEditToggle}>
            {this.state.data.name}
            <span className={'element-id'}>({this.state.data.id} : {this.state.data.type})</span>
          </span>
        );
      }
    }

    const iconMappings = {
      'Package': {
        icon: (this.state.isOpen) ? 'folder-open' : 'folder',
        color: 'lightblue'
      },
      'package': {
        icon: (this.state.isOpen) ? 'folder-open' : 'folder',
        color: 'lightblue'
      },
      'uml:Package': {
        icon: (this.state.isOpen) ? 'folder-open' : 'folder',
        color: 'lightblue'
      },
      'Diagram': {
        icon: 'sitemap',
        color: 'lightgreen'
      },
      'diagram': {
        icon: 'sitemap',
        color: 'lightgreen'
      },
      'uml:Diagram': {
        icon: 'sitemap',
        color: 'lightgreen'
      },
      'uml:Association': {
        icon: 'arrows-alt-h',
        color: '#333333'
      },
      'uml:Slot': {
        icon: 'circle',
        color: 'MediumPurple'
      },
      'uml:Property': {
        icon: 'circle',
        color: 'Gold'
      }
    };
    if (this.state.data !== null
      && iconMappings.hasOwnProperty(this.state.data.type)) {
      let icon = iconMappings[this.state.data.type]['icon'];
      let color = iconMappings[this.state.data.type]['color'];;
      elementIcon = (
        <i className={`fas fa-${icon}`}
        style={{color: color}}></i>
      );
    }

    return (
            <div id={`tree-${this.props.id}`}
                 className={(this.props.parent) ? 'element-tree' : 'element-tree-root'}>
                <i className={`fas ${expandIcon}`}
                   onClick={this.toggleCollapse}>
                </i>
                <div onClick={this.props.onClick}>
                  {elementIcon}
                  {element}
                </div>
                {(this.state.isOpen) ? (<div>{subtree}</div>) : ''}
            </div>
    )
  }
}

// Export component
export default ElementTree
