/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.general-components.sidebar
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a sidebar link.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UncontrolledTooltip } from 'reactstrap';

function SidebarLink(props) {
    const sidebarItem = (
        <div className='sidebar-item' id={props.title}>
            {(!props.isExpanded) ? <i className={props.icon}/> : ''}
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
            {(props.isExpanded) ? <p> {props.title} </p> : ''}
        </div>
    );

    return (props.routerLink)
        ? <NavLink exact to={props.routerLink}> {sidebarItem} </NavLink>
        : <a href={props.href} onClick={props.onClick}> {sidebarItem} </a>;
}

export default SidebarLink
