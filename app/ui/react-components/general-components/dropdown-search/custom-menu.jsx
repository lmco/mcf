/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the user role edit page.
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
    const  value = props.username;

    // Return
    return (
        <div style={style} className={className} aria-labelledby={labeledBy}>
            <Input autoFocus
                   className="mx-3 my-2 w-auto"
                   placeholder="Type to filter..."
                   onChange={props.onChange}
                   value={value}/>
            <ul className="list-unstyled" onClick={props.onChange}>
                {React.Children.toArray(children).filter(
                    child =>
                        !value || child.props.children.toLowerCase().startsWith(value) || child.props.value.startsWith(value)
                )}
            </ul>
        </div>
    );
}

// Export component
export default CustomMenu
