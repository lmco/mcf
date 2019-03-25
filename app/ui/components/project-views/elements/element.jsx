/**
* Classification: UNCLASSIFIED
*
* @module ui.components.project-views.elements.element
*
* @copyright Copyright (C) 2018, Lockheed Martin Corporation
*
* @license LMPI - Lockheed Martin Proprietary Information
*
* @owner Leah De Laurell <leah.p.delaurell@lmco.com>
*
* @author Leah De Laurell <leah.p.delaurell@lmco.com>
*
* @description This renders the sidebar.
*/

/* Modified ESLint rules for React. */
/* eslint no-unused-vars: "warn" */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import { ajaxRequest } from '../../helper-functions/ajaxRequests.js';

// Define component
class Element extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      element: null,
      error: null
    };

    this.getElement = this.getElement.bind(this);
  }

  getElement() {
    // Initialize variables
    const elementId = this.props.id;
    const url = `${this.props.url}/branches/master/elements/${elementId}`;
    // Get project data
    ajaxRequest('GET', `${url}`)
    .then(element => {
      this.setState({ element: element });
    })
    .catch(err => {
      // Throw error and set state
      this.setState({ error: `Failed to load element: ${err.responsetext}` });
    });
  }

  componentDidMount() {
    this.getElement();
  }


  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.id !== prevProps.id) {
      this.getElement();
    }
  }

  render() {
    let element;
    let orgid;
    let projid;
    let name;
    let custom;

    if (this.state.element) {
      element = this.state.element;
      orgid = element.org;
      projid = element.project;
      custom = element.custom;
      name = element.name;

      if (element.name !== null) {
        name = element.name;
      }
      else {
        name = element.id;
      }
    }

    // Render the sidebar with the links above
    return (
      <div className='element-panel-display'>
        {(!this.state.element)
          ? <div className="loading"> {this.state.error || 'Loading your element...'} </div>
          : (<React.Fragment>
              <div className='side-icons'>
                <i className='fas fa-edit edit-btn' onClick={this.props.editElementInfo}/>
                <i className='fas fa-times exit-btn' onClick={this.props.closeSidePanel}/>
              </div>
              <div className='element-data'>
                <h2>
                  Element Information
                </h2>
                <hr/>
                <table>
                  <tbody>
                  <tr>
                    <th>Name:</th>
                    <td>{name}</td>
                  </tr>
                  <tr>
                    <th>ID:</th>
                    <td>{element.id}</td>
                  </tr>
                  <tr>
                    <th>Parent:</th>
                    <td>{element.parent}</td>
                  </tr>
                  <tr>
                    <th>Type:</th>
                    <td>{element.type}</td>
                  </tr>
                  <tr>
                    <th>Documentation:</th>
                    <td>{element.documentation}</td>
                  </tr>
                  <tr>
                    <th>Org ID:</th>
                    <td><a href={`/${orgid}`}>{orgid}</a></td>
                  </tr>
                  <tr>
                    <th>Project ID:</th>
                    <td><a href={`/${orgid}/${projid}`}>{projid}</a></td>
                  </tr>
                  <tr>
                    <th>Last Modified By:</th>
                    <td>{element.lastModifiedBy}</td>
                  </tr>
                  <tr>
                    <th>Updated On:</th>
                    <td>{element.updatedOn}</td>
                  </tr>
                  <tr>
                  <th>Custom:</th>
                  <td>{JSON.stringify(custom, null, 2)}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </React.Fragment>
          )
        }
      </div>

    );
  }

}

// Export component
export default Element;