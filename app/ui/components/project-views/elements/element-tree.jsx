/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.elements-tree
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
 * @description This the element tree wrapper, grabbing the
 *  root model element and then the subtree.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import ElementSubtree from './element-subtree.jsx';

/* eslint-enable no-unused-vars */

// Define component
class ElementTree extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    this.state = {
      url: '',
      id: null,
      refreshFunction: null,
      treeRoot: null,
      branch: props.branch,
      childrenOpen: {},
      error: null
    };

    this.getElement = this.getElement.bind(this);
    this.setChildOpen = this.setChildOpen.bind(this);
  }

  setChildOpen(id, state) {
    this.state.childrenOpen[id] = state;
  }

  getElement() {
    const orgId = this.props.project.org;
    const projId = this.props.project.id;
    const branchId = this.state.branch;
    const base = `/api/orgs/${orgId}/projects/${projId}/branches/${branchId}`;
    const url = `${base}/elements/model?fields=id,name,contains,type,archived&minified=true&archived=true`;

    this.setState({ url: base });

    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (data) => { this.setState({ treeRoot: data }); },
        401: () => {
          this.setState({ treeRoot: null });

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          this.setState({ error: err.responseText });
        },
        404: (err) => {
          this.setState({ error: err.responseText });
        }
      }
    });
  }

  componentDidMount() {
    this.getElement();
  }

  render() {
    let tree = null;
    if (this.state.treeRoot !== null) {
      tree = <ElementSubtree id='model'
                             url={this.state.url}
                             data={this.state.treeRoot}
                             project={this.props.project}
                             parent={null}
                             isOpen={true}
                             archived={this.props.archived}
                             childrenOpen={this.state.childrenOpen}
                             setChildOpen={this.setChildOpen}
                             parentRefresh={this.getElement}
                             clickHandler={this.props.clickHandler}/>;
    }

    // Return element list
    return (
        <div id='element-tree-container'>
          {tree}
        </div>
    );
  }

}

// Export component
export default ElementTree;
