/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.dropdown-search
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

// React Modules
import React from 'react';
import { Input } from 'reactstrap';

// Define function
function CustomMenu(props){
  // Initialize props
  const {
    children,
    style,
    className,
    'aria-labelledby': labeledBy,
  } = props;

  const  searchParam = props.username;

  // Return filtering list
  return (
        <div style={style} className={className} aria-labelledby={labeledBy}>
            {/* Input to filter list*/}
            <Input autoFocus
                   className="mx-3 my-2 w-auto"
                   placeholder="Type to filter..."
                   onChange={props.onChange}
                   value={searchParam}/>
           {/* List of children */}
            <ul className="list-unstyled" onClick={props.onChange}>
                {React.Children.toArray(children).filter(
                  child => {
                    let ret = null;
                    // Verify if the children name or value start with search parameter
                    try {
                      ret = (!searchParam
                                || child.props.children.toLowerCase().startsWith(searchParam));
                    }
                    catch (err) {
                      ret = child.props.value.startsWith(searchParam)
                    }
                    return ret;
                  }
                )}
            </ul>
        </div>
  );
}

// Export component
export default CustomMenu
