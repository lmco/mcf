/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.sidebar
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a sidebar link.
 */

// React Modules
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UncontrolledTooltip } from 'reactstrap';

// Define function
function SidebarLink(props) {
    // Define sidebar item
    const sidebarItem = (
        <div className='sidebar-item' id={props.title}>
            <i className={props.icon}/>
            {/*if sidebar is not expanded, set a name when hovering over icon*/}
            {(!props.isExpanded) ?
                <UncontrolledTooltip placement='right'
                                     target={props.title}
                                     delay={{
                                         show: 0,
                                         hide: 0
                                     }}
                                     boundariesElement='viewport'
                >
                    {props.tooltip || props.title}
                </UncontrolledTooltip>
                : ''}
            {/*if sidebar is expanded, set the name of link*/}
            {(props.isExpanded) ? <p> {props.title} </p> : ''}
        </div>
    );

    // Returns the sidebar item as NavLink or href
    return (props.routerLink)
        ? <NavLink exact to={props.routerLink}> {sidebarItem} </NavLink>
        : <a href={props.href} onClick={props.onClick}> {sidebarItem} </a>;
}

// Export function
export default SidebarLink
