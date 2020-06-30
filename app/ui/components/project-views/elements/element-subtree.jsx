/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.element-subtree
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
 * @description This renders the elements in the element
 * tree in the project's page.
 */
/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';


/* eslint-enable no-unused-vars */

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Define component
export default function ElementSubtree(props) {
  const [state, setState] = useState({
    id: props.id,
    isOpen: !!(props.id === 'model' || props.expand),
    data: props.data,
    children: null,
    elementWindow: false,
    isSelected: true,
    error: null
  });
  const [isOpen, setIsOpen] = useState(!!(props.id === 'model' || props.expand));
  const [data, setData] = useState(props.data);
  const [children, setChildren] = useState(null);
  // const [elementWindow, setElementWindow] = useState(false);
  const [error, setError] = useState(null);

  const prevData = usePrevious(props.data);
  const prevExpand = usePrevious(props.expand);
  const prevCollapse = usePrevious(props.collapse);

  // /**
  //  * @description Toggle the element sub tree.
  //  */
  // const handleElementToggle = () => {
  //   setElementWindow((currentState) => !currentState);
  // };

  /**
   * @description Toggle the element to display it's children.
   */
  const toggleCollapse = () => {
    if (props.unsetCheckbox) {
      props.unsetCheckbox();
    }
    setIsOpen((currentState) => !currentState);
  };

  /**
   * @description When an element is clicked, parses the ID and call the passed in
   * click handler function.
   */
  const handleClick = () => {
    const elementId = props.id.replace('tree-', '');
    props.clickHandler(elementId);
  };

  /**
   * @description When an element is deleted, created, or updates the parent
   * the elements will be updated.
   */
  const refresh = () => {
    // Build URL to get element data
    const base = props.url;
    const url = `${base}/elements/${state.id}?minified=true&includeArchived=true`;

    // Get element data
    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (newData) => {
          // Set the element data
          setData(newData);
        },
        401: (err) => {
          // Set error
          setError(err.responseText);

          // Refresh when session expires
          window.location.reload();
        },
        404: (err) => {
          // Set error
          setError(err.responseText);
        }
      }
    });
  };

  const initialize = () => {
    // Verify setRefreshFunction is not null
    if (props.setRefreshFunctions) {
      // Provide refresh function to top parent component
      props.setRefreshFunctions(state.id, refresh);
    }

    // Build URL to get element data
    const contains = data.contains;
    const parent = data.id;
    // Verify element does not have children
    if (contains === null || contains.length === 0) {
      // Skip ajax call for children
      return;
    }
    const base = props.url;
    const url = `${base}/elements?parent=${parent}&fields=id,name,contains,archived,type&minified=true&includeArchived=true`;

    // Get children
    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (newData) => {
          // Sort data by name or special cases
          const result = newData.sort((a, b) => {
            if (!a.name) {
              return 1;
            }
            else if (!b.name) {
              return -1;
            }
            else {
              const first = a.name.toLowerCase();
              const second = b.name.toLowerCase();

              if (first === '__mbee__') {
                return -1;
              }
              else if ((second === '__mbee__') || (first > second)) {
                return 1;
              }
              else {
                return -1;
              }
            }
          });

          // Set the sorted data as children
          setChildren(result);
        },
        401: (err) => {
          // Unset children and display error
          setChildren(null);
          setError(err.responseText);

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          // Display error
          setError(err.responseText);
        },
        404: (err) => {
          // Display error
          setError(err.responseText);
        }
      }
    });
  };


  // Run on mount
  // useEffect(() => {
  //   console.log('initializing on mount')
  //   initialize();
  // }, []);

  // on update of data
  useEffect(() => {
    // Verify if component needs to re-render
    // Due to the update from state props of data
    if (data !== prevData) {
      initialize();
    }
    else if (props.data.contains.length !== prevData.contains.length) {
      setData(props.data);
      initialize();
    }

    if ((props.expand !== prevExpand) && !!(props.expand)) {
      setIsOpen(true);
    }
    if ((props.collapse !== prevCollapse) && !!(props.collapse)) {
      if (props.id !== 'model') {
        setIsOpen(false);
      }
    }
  }, [props]);


  // Initialize variables
  let elementLink;
  const initColor = (data.archived) ? '#c0c0c0' : '#333';
  let elementIcon = (
    <i className={'fas fa-cube'}
       style={{ color: initColor }}/>
  );
  let expandIcon = 'fa-caret-right transparent';
  const subtree = [];

  // If the element contains other elements, handle the subtree
  if (Array.isArray(data.contains) && data.contains.length >= 1) {
    // Icon should be caret to show subtree is collapsible
    expandIcon = (isOpen) ? 'fa-caret-down' : 'fa-caret-right';

    // Create Subtrees
    if (children !== null) {
      for (let i = 0; i < children.length; i++) {
        subtree.push(
          <ElementSubtree key={`tree-${children[i].id}`}
                          id={`${children[i].id}`}
                          data={children[i]}
                          project={props.project}
                          parent={true}
                          archived={props.archived}
                          displayIds={props.displayIds}
                          expand={props.expand}
                          collapse={props.collapse}
                          setRefreshFunctions={props.setRefreshFunctions}
                          parentRefresh={refresh}
                          linkElements={props.linkElements}
                          clickHandler={props.clickHandler}
                          unsetCheckbox={props.unsetCheckbox}
                          isOpen={isOpen}
                          url={props.url}/>
        );
      }
    }
  }

  // Build the rendered element item
  let element = '';
  // Verify data available
  if (data !== null) {
    // Verify if archived
    if (!data.archived) {
      // Element should be rendered as the ID initially
      element = (
        <span className={'element-id'}>
         {data.id}
      </span>
      );
      // If the name is not blank, render the name
      if (data.name !== '' && props.displayIds) {
        element = (
          <span>
          {data.name}
            <span className={'element-id'}>({data.id})</span>
        </span>
        );
      }
      // If the name is not blank and has displayId to false
      else if (data.name !== '' && !props.displayIds) {
        element = (
          <span>
          {data.name}
          </span>
        );
      }
    }
    // If the element is archived and archived toggle is true
    else if (props.archived && data.archived) {
      // Element should be rendered as the ID initially
      element = (
        <span className='element-id'>
         {data.id}
        </span>
      );
      // If the name is not blank, render the name
      if (data.name !== '' && props.displayIds) {
        element = (
          <span className='grayed-out'>
            {data.name}
            <span className='element-id'>({data.id})</span>
          </span>
        );
      }
      // If the name is not blank and has displayIds to false
      else if (data.name !== '' && !props.displayIds) {
        element = (
          <span className='grayed-out'>
          {data.name}
          </span>
        );
      }
    }
  }

  const iconMappings = {
    Package: {
      icon: (isOpen) ? 'folder-open' : 'folder',
      color: 'lightblue'
    },
    package: {
      icon: (isOpen) ? 'folder-open' : 'folder',
      color: 'lightblue'
    },
    'uml:Package': {
      icon: (isOpen) ? 'folder-open' : 'folder',
      color: 'lightblue'
    },
    Diagram: {
      icon: 'sitemap',
      color: 'lightgreen'
    },
    diagram: {
      icon: 'sitemap',
      color: 'lightgreen'
    },
    association: {
      icon: 'arrows-alt-h',
      color: '#333333'
    },
    Association: {
      icon: 'arrows-alt-h',
      color: '#333333'
    },
    relationship: {
      icon: 'arrows-alt-h',
      color: '#333333'
    },
    Relationship: {
      icon: 'arrows-alt-h',
      color: '#333333'
    },
    Edge: {
      icon: 'arrows-alt-h',
      color: '#333333'
    },
    edge: {
      icon: 'arrows-alt-h',
      color: '#333333'
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
    },
    Document: {
      icon: 'file-alt',
      color: '#465faf'
    },
    View: {
      icon: 'align-center',
      color: '#b0f2c8'
    }
  };

  // Verify data available and type in mapping
  if (data !== null
    && iconMappings.hasOwnProperty(data.type)) {
    // Set the icon to a new icon and color
    const icon = iconMappings[data.type].icon;
    const color = (data.archived) ? '#c0c0c0' : iconMappings[data.type].color;
    elementIcon = (
      <i className={`fas fa-${icon}`}
         style={{ color: color }}/>
    );
  }

  // Verify if it is linked element
  if (props.linkElements) {
    elementLink = (
      <Link to={`#${props.id}`}
            onClick={handleClick}
            className='element-link'>
          <span className='element-name'>
            {elementIcon}
            {element}
          </span>
      </Link>);
  }
  else {
    elementLink = (
      <span onClick={handleClick}
           className='element-link'>
        <span className='element-name'>
            {elementIcon}
          {element}
        </span>
      </span>);
  }

  // Verify data is not archived and
  // toggle archived is false
  if (data.archived && !props.archived) {
    return null;
  }
  else {
    return (
      <div id={`tree-${props.id}`}
           className={(props.parent) ? 'element-tree' : 'element-tree element-tree-root'}>
        <i className={`fas ${expandIcon}`}
           onClick={toggleCollapse}>
        </i>
        {elementLink}
        {(isOpen) ? (<div>{subtree}</div>) : ''}
      </div>);
  }
}
