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
    let url = `${base}/elements/${this.props.id}?fields=id,name,contains`;

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
    let icon = 'cube';
    let subtree = [];

    // If the element contains other elements, handle the subtree
    if (this.state.data !== null
            && Array.isArray(this.state.data.contains)
            && this.state.data.contains.length >= 1) {

      // Icon should be chevron to show subtree is collapsible
      icon = (this.state.isOpen) ? 'chevron-down' : 'chevron-right';

      // Create Subtrees
      for (let i = 0; i < this.state.data.contains.length; i++) {
        subtree.push(
                    <ElementTree key={`tree-${this.state.data.contains[i]}`}
                                 id={this.state.data.contains[i]}
                                 project={this.props.project}
                                 parent={this.state}
                                 isOpen={false}/>
        );
      }
    }

    // Build the rendered element item
    let element = '';
    if (this.state.data !== null) {
      // Element should be rendered as the ID initially
      element = (
        <Label className='element' onClick={this.handleEditToggle}>
          {this.state.data.id}
        </Label>
      );
      // If the name is not blank, render the name
      if (this.state.data.name !== '') {
        element = (
          <Label className='element' onClick={this.handleEditToggle}>
            {this.state.data.name}({this.state.data.id})
          </Label>

        );
      }
    }

    return (
            <div id={`tree-${this.props.id}`} className={(this.props.parent) ? 'element-tree' : 'element-tree-root'}>
                <i className={`fas fa-${icon}`}
                   onClick={this.toggleCollapse}>
                </i>
                {element}
                {(this.state.isOpen) ? (<div>{subtree}</div>) : ''}
            </div>
    )
  }
}

// Export component
export default ElementTree
