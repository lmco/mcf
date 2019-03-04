/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.list
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
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
    else if (props.href) {
        return  <a href={props.href} onClick={props.onClick}> {listItem} </a>
    }
    else {
        return listItem;
    }
}

export default ListItem;
