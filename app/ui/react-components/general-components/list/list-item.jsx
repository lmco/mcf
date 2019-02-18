/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.general-components.list
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
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a list item.
 */
import React from 'react';

function ListItem(props) {

    const listItem = (
        <div className='list-item'>
            {props.children}
         </div>
    );

    if (props.routerLink) {
        <NavLink exact to={props.routerLink}> {listItem} </NavLink>
    }
    else if (props.href || props.onClick) {
        return  <a href={props.href} onClick={props.onClick}> {listItem} </a>
    }
    else if (props.element) {
        return <div> {props.element.name} </div>
    }
    else {
        return listItem;
    }
}

export default ListItem;
