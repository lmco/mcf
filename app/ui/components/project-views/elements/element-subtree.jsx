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

// MBEE modules
import { useApiClient } from '../../context/ApiClientProvider';


/* eslint-enable no-unused-vars */

/**
 * @description A helper function to allow the use of a value that persists between renders
 * while lagging behind the value of state by one render.
 *
 * @param {*} value - The value to store.
 * @returns {*} The current value of the ref that was created for the input variable.
 */
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * @description The Element Subtree component.
 *
 * @param {object} props - React props.
 * @returns {Function} - Returns JSX.
 */
export default function ElementSubtree(props) {
  const { elementService } = useApiClient();
  const [isOpen, setIsOpen] = useState(!!(props.id === 'model' || props.expand));
  const [data, setData] = useState(props.data);
  const [children, setChildren] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);

  const prevData = usePrevious(data);
  const prevExpand = usePrevious(props.expand);
  const prevCollapse = usePrevious(props.collapse);

  const orgID = props.project.org;
  const projID = props.project.id;
  const branchID = props.branchID;

  /**
   * @description Toggle the element to display its children.
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
  const refresh = async () => {
    const options = {
      ids: props.id,
      includeArchived: true
    };

    // Get element data
    const [err, elements] = await elementService.get(orgID, projID, branchID, options);

    if (err) setError(err);
    else if (elements) setData(elements[0]);
  };

  const initialize = async () => {
    // Verify setRefreshFunction is not null
    if (props.setRefreshFunctions) {
      // Provide refresh function to top parent component
      props.setRefreshFunctions(props.id, refresh);
    }

    const contains = data.contains;
    const parent = data.id;
    // Verify element does not have children
    if (!contains || contains.length === 0) {
      // Skip ajax call for children
      return;
    }

    // Get child elements
    const options = {
      parent: parent,
      fields: 'id,name,contains,archived,type',
      sort: 'name',
      includeArchived: true
    };

    const [err2, elements] = await elementService.get(orgID, projID, branchID, options);

    if (err2) {
      setError(err2);
    }
    else if (elements) {
      // Sort so that the __mbee__ element is first
      const list = [];
      let __mbee__;
      elements.forEach((element) => {
        if (element.id === '__mbee__') __mbee__ = element;
        else list.push(element);
      });
      if (__mbee__) list.unshift(__mbee__);
      setChildren(list);
    }
  };

  // on update of props or data
  useEffect(() => {
    // Verify if component needs to re-render
    if (data !== prevData) {
      initialize();
    }
    else if (props.data !== data) {
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
  }, [props.data, props.expand, props.collapse, data]);


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
                          branchID={props.branchID}
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
