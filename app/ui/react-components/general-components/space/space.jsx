/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components.space
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 */
import React, { Component } from 'react';
import start from './space.js';

class Space extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        start();
    }

    render() {
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

export default Space;
