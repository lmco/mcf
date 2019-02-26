/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.home-page.tile
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders a home page tile.
 */
import React from 'react';

function Tile(props) {
    const classes = "col-2" + props.id;

  return (
    <div className={classes} style={{'text-align': 'center'}}>
        <a href={props.href} className="home-link">
          <div className="home-link-icon">
            <i className={props.icon}></i>
          </div>
          <div className="home-link-label">
            <p>{props.children}</p>
          </div>
        </a>
    </div>
  )
}

export default Tile
