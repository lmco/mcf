/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.element
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 *
 * @description This renders the element information side panel.
 * Displaying the information on an element selected from the tree.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { useState, useEffect } from 'react';

// MBEE modules
import {
  Modal,
  ModalBody,
  UncontrolledTooltip,
  Badge
} from 'reactstrap';
import Delete from '../../shared-views/delete.jsx';
import CustomData from '../../general/custom-data/custom-data.jsx';
import { useElementContext } from './ElementContext.js';

/* eslint-enable no-unused-vars */

// Define component
export default function Element(props) {
  const [element, setElement] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [error, setError] = useState(null);

  const { elementID } = useElementContext();

  const handleCrossRefs = (_element) => {
    return new Promise((resolve, reject) => {
      // Match/find all cross references
      const allCrossRefs = _element.documentation.match(/\[cf:[a-zA-Z0-9\-_]*\]/g);

      // If no cross refs, resolve the element with no changes
      if (!allCrossRefs || allCrossRefs.length === 0) {
        return resolve(_element);
      }

      // Make into an object for a uniqueness
      const uniqCrossRefs = {};
      allCrossRefs.forEach(xr => {
        const ref = xr.replace('cf:', '').slice(1, -1);
        uniqCrossRefs[xr] = { id: ref };
      });

      // Get a list of IDs from the cross-references
      const uniqCrossRefsValues = Object.values(uniqCrossRefs);
      const ids = uniqCrossRefsValues.map(xr => xr.id);

      // Make AJAX call to get names of cross-references elements ....
      const opts = [
        `ids=${ids}`,
        'format=jmi2',
        'fields=id,name,org,project,branch',
        'minified=true'
      ].join('&');
      $.ajax({
        method: 'GET',
        url: `${this.props.url}/elements/?${opts}`,
        statusCode: {
          200: (elements) => {
            // Keep track of documentation fields
            // and cross reference text
            let doc = _element.documentation;
            const refs = Object.keys(uniqCrossRefs);

            // Loop over cross refs list and replace each occurrence of that
            // cross-ref in the documentation fields
            for (let i = 0; i < refs.length; i++) {
              // Get the ref, replacing special characters for use in regex
              const ref = refs[i]
              .replace('[', '\\[')
              .replace(']', '\\]')
              .replace('-', '\\-');
              // Create the regex for replacement
              const re = new RegExp(ref, 'g'); // eslint-disable-line security/detect-non-literal-regexp

              // Capture the element ID and link
              const id = uniqCrossRefs[refs[i]].id;
              if (!elements.hasOwnProperty(id)) {
                doc = doc.replace(re, `<a class='cross-ref-broken' href='#'>${refs[i]}</a>`);
                continue;
              }
              const oid = elements[id].org;
              const pid = elements[id].project;
              const bid = elements[id].branch;
              const link = `/orgs/${oid}/projects/${pid}/branches/${bid}/elements#${id}`;
              doc = doc.replace(re, `<a class='cross-ref' href='${link}' target='_blank'>${elements[id].name}</a>`);
            }

            // Resolve the element
            const elem = _element;
            elem.documentation = doc;
            return resolve(elem);
          },
          401: (err) => {
            reject(err.responseText);
            // Refresh when session expires
            window.location.reload();
          },
          // Even though error occurred, return element. Cross reference does not exist
          // so return documentation as is
          404: () => resolve(_element)
        }
      });
    });
  };

  const getElement = () => {
    const url = `${props.url}/elements/${elementID}?minified=true&includeArchived=true`;
    // Get project data
    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (elem) => {
          handleCrossRefs(elem)
          .then(elementChanged => {
            setElement(elementChanged);
          })
          .catch(err => {
            setError(err);
          });
        },
        401: (err) => {
          // Throw error and set state
          setError(err.responseText);

          // Refresh when session expires
          window.location.reload();
        },
        404: (err) => {
          setError(err.responseText);
        }
      }
    });
  };

  // Define toggle function
  const handleDeleteToggle = () => {
    // Set the delete modal state
    setModalDelete((currentState) => !currentState);
  };

  // Run on initialization
  useEffect(() => {
    if (elementID) getElement();
  }, [elementID]);

  // componentDidUpdate(prevProps) {
  //   // Typical usage (don't forget to compare props):
  //   if (this.props.id !== prevProps.id) {
  //     this.getElement();
  //   }
  // }
  //
  // componentWillUnmount() {
  //   // Set mounted variable
  //   this.mounted = false;
  // }


  let orgid;
  let projid;
  let name;
  let custom;
  let target;
  let source;

  if (element) {
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

    if (element.targetNamespace) {
      const nameSpace = element.targetNamespace;
      target = (
        <a href={`/orgs/${nameSpace.org}/projects/${nameSpace.project}/branches/${nameSpace.branch}/elements#${element.target}`}>
          <UncontrolledTooltip placement='top' target='target-elem'>
            {`${nameSpace.org} > ${nameSpace.project} > ${nameSpace.branch}`}
          </UncontrolledTooltip>
          <span id='target-elem'>
            {element.target}
          </span>
        </a>);
    }
    else {
      target = (<span>{element.target}</span>);
    }

    if (element.sourceNamespace) {
      const nameSpace = element.sourceNamespace;
      source = (
        <a href={`/orgs/${nameSpace.org}/projects/${nameSpace.project}/branches/${nameSpace.branch}/elements#${element.source}`}>
          <UncontrolledTooltip placement='top' target='source-elem'>
            {`${nameSpace.org} > ${nameSpace.project} > ${nameSpace.branch}`}
          </UncontrolledTooltip>
          <span id='source-elem'>
            {element.source}
          </span>
        </a>);
    }
    else {
      source = (<span>{element.source}</span>);
    }
  }

  // Render the sidebar with the links above
  return (
    <div className='element-panel-display'>
      {/* Modal for deleting an element */}
      <Modal isOpen={modalDelete} toggle={handleDeleteToggle}>
        <ModalBody>
          <Delete element={element}
                  closeSidePanel={props.closeSidePanel}
                  toggle={handleDeleteToggle}/>
        </ModalBody>
      </Modal>
      {(element)
        ? <div className='element-data'>
          <div className='element-header'>
            <h2>
              Element Information
              {(element.archived)
                ? (<Badge style={{ marginLeft: '15px' }} color='secondary'>
                  Archived
                </Badge>)
                : ''
              }
            </h2>
            <div className='side-icons'>
              {((props.permissions === 'write') || props.permissions === 'admin')
                ? (<React.Fragment>
                  <UncontrolledTooltip placement='left' target='deleteBtn'>
                    Delete
                  </UncontrolledTooltip>
                  <i id='deleteBtn' className='fas fa-trash-alt delete-btn' onClick={handleDeleteToggle}/>
                  <i id='editBtn' className='fas fa-edit edit-btn' onClick={props.toggle}/>
                  <UncontrolledTooltip placement='left' target='editBtn'>
                    Edit
                  </UncontrolledTooltip>
                </React.Fragment>)
                : ''
              }
              <UncontrolledTooltip placement='left' target='exitBtn'>
                Exit
              </UncontrolledTooltip>
              <i id='exitBtn' className='fas fa-times exit-btn' onClick={props.closeSidePanel}/>
            </div>
          </div>
          <table className='table-width'>
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
            {(!element.target || !element.source)
              ? <tr/>
              : (<React.Fragment>
                  <tr>
                    <th>Target:</th>
                    <td>{target}</td>
                  </tr>
                  <tr>
                    <th>Source:</th>
                    <td>{source}</td>
                  </tr>
                </React.Fragment>
              )
            }
            <tr>
              <th>Documentation:</th>
              <td>
                <div dangerouslySetInnerHTML={{ __html: element.documentation }}>
                </div>
              </td>
            </tr>
            <tr>
              <th>Org ID:</th>
              <td><a href={`/orgs/${orgid}`}>{orgid}</a></td>
            </tr>
            <tr>
              <th>Project ID:</th>
              <td><a href={`/orgs/${orgid}/projects/${projid}/branches/master/elements`}>{projid}</a></td>
            </tr>
            <tr>
              <th>Last Modified By:</th>
              <td>{element.lastModifiedBy}</td>
            </tr>
            <tr>
              <th>Updated On:</th>
              <td>{element.updatedOn}</td>
            </tr>
            </tbody>
          </table>
          <CustomData data={custom}/>
        </div>
        : <div className="loading"> {error || 'Loading your element...'} </div>
      }
    </div>
  );
}
