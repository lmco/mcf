/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.general.dropdown-search.custom-menu
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the filter list of the usernames.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';
import { Input, UncontrolledDropdown, UncontrolledCollapse, Button } from 'reactstrap';

/* eslint-enable no-unused-vars */

// Define function
function CustomMenu(props) {
  // Initialize props
  const {
    children,
    style,
    className,
    'aria-labelledby': labeledBy
  } = props;

  const searchParam = props.username;

  // Return filtering list
  return (
    <div style={style} className={className} aria-labelledby={labeledBy}>
      {/* Input to filter list */}
      <div className='username-search'>
        <Input autoFocus
               placeholder='Search...'
               className="user-searchbar my-2 w-auto"
               onChange={props.onChange}
               value={searchParam}/>
        <Button id='searchBtn'
                className='search-button'
                color='primary'>
          Search
        </Button>
      </div>
      {/* List of children */}
      <div className='dropdown-list'>
        <UncontrolledCollapse toggler='#searchBtn'>
          <UncontrolledDropdown>
            <ul className='drop-list' onClick={props.onChange}>
              {React.Children.toArray(children).filter(
                child => {
                  let ret = null;
                  // Verify if the children name or value start with search parameter
                  if (child.props.value.startsWith(searchParam)) {
                    ret = child.props.value.startsWith(searchParam);
                  }
                  else {
                    try {
                      child.props.children.forEach((name) => {
                        if (name.toLowerCase().startsWith(searchParam)) {
                          ret = name.toLowerCase().startsWith(searchParam);
                        }
                      });
                    }
                    catch (err) {
                      ret = child.props.value.startsWith(searchParam);
                    }
                  }
                  return ret;
                }
              )}
            </ul>
          </UncontrolledDropdown>
        </UncontrolledCollapse>
       </div>
    </div>
  );
}

// Export component
export default CustomMenu;
