/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.element-tree
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 * @author Josh Kaplan
 * @author James Eckstein
 *
 * @description This the element tree wrapper, grabbing the
 * root model element and then pushing to the subtree to
 * create the elements.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { useState, useEffect } from 'react';

// MBEE modules
import ElementSubtree from './element-subtree.jsx';
/* eslint-enable no-unused-vars */

// Define component
export default function ElementTree(props) {
  const [treeRoot, setTreeRoot] = useState(null);
  const [error, setError] = useState(null);
  // const [state, setState] = useState({
  //   url: '',
  //   id: null,
  //   treeRoot: null,
  //   error: null
  // });

  const orgId = props.project.org;
  const projId = props.project.id;
  const branchId = props.branch;
  const urlBase = `/api/orgs/${orgId}/projects/${projId}/branches/${branchId}`;

  /**
   * @description This is also considered the refresh function for root
   * element. When an element is deleted or created the
   * elements will be updated.
   */
  const getElement = () => {
    const url = `${urlBase}/elements/model?fields=id,name,contains,type,archived&minified=true&includeArchived=true`;

    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (data) => setTreeRoot(data),
        401: () => {
          setTreeRoot(null);

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          setError(err.responseText);
        },
        404: (err) => {
          setError(err.responseText);
        }
      }
    });
  };

  // Run once, on component mount
  useEffect(() => {
    getElement();
  }, []);

  // Run if the project was changed
  useEffect(() => {
    getElement();
  }, [props.project]);


  let tree = null;

  if (treeRoot !== null) {
    tree = <ElementSubtree id='model'
                           url={urlBase}
                           data={treeRoot}
                           project={props.project}
                           parent={null}
                           archived={props.archived}
                           setRefreshFunctions={props.setRefreshFunctions}
                           displayIds={props.displayIds}
                           expand={props.expand}
                           collapse={props.collapse}
                           linkElements={props.linkElements}
                           parentRefresh={getElement}
                           unsetCheckbox={props.unsetCheckbox}
                           handleCheck={props.handleCheck}
                           clickHandler={props.clickHandler}/>;
  }

  // Return element list
  return (
    <div id='element-tree-container'>
      {tree}
    </div>
  );
}
