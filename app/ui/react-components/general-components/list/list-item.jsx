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
    else if (props.element) {
<<<<<<< HEAD
        if (props.element.name){
            return <div> <i className="fas fa-shapes"></i> {props.element.name} </div>
        }
        else {
            return <div> <i className="fas fa-shapes"></i> {props.element.id} </div>
        }
=======
        return <div className='element-item' onClick={props.onClick}> {props.element.name} </div>
>>>>>>> e77e7ff967c4621cb7f8f15d57afb342e8eba53d
    }
    else {
        return listItem;
    }
}

export default ListItem;
