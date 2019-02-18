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
 * @description This renders a list.
 */
import React from 'react';

function List(props) {
    const listItems = React.Children.map(props.children, (child, i) =>
        <React.Fragment>
            {child}
            {/*{(React.Children.count(props.children) - 1 === i) ? '' : <hr/>}*/}
        </React.Fragment>
    );

    let appliedClasses = 'list';
    if(props.className) {
        appliedClasses += ` ${props.className}`;
    }

    return (
        <div className={appliedClasses}>
            {listItems}
        </div>
    )
}


export default List
