/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.space
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import start from './space.js';

// Define component
class Space extends Component {
  constructor(props) {
    // Initialize parent props
    super(props);
  }

  componentDidMount() {
    start();
  }

  render() {
    // Render space
    return (
            <canvas id="game-canvas"
                    style={{
                      display: 'block',
                      margin: 'auto',
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      'image-rendering': 'optimizeSpeed',
                      'image-rendering': '-moz-crisp-edges',
                      'image-rendering': '-webkit-optimize-contrast',
                      'image-rendering': 'optimize-contrast',
                      width: '50%',
                      height: '100%',
                      'z-index': '1000',
                      'background': '#000'
                    }}>
            </canvas>
    );
  }
}

// Export component
export default Space;
