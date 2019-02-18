/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.home-page
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This renders the homepage.
 */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Modal, ModalBody } from 'reactstrap';

import Space from '../general-components/space/space.jsx';

class HomePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            modal: false
        };

        this.handleToggle = this.handleToggle.bind(this);
    }

    componentDidMount() {
        let buffer,
            latchId,
            code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13];

        const k = (ev) => {
            buffer = buffer || code.slice();
            if (buffer[0] === ev.keyCode) {
                window.clearTimeout(latchId);
                buffer.splice(0, 1);
                if (buffer.length === 0) {
                    this.handleToggle();
                }
                latchId = window.setTimeout(function () {
                    buffer = code.slice();
                }, 2000);
            }
        };
        window.addEventListener("keyup", k);
    }

    handleToggle() {
        this.setState({ modal: !this.state.modal });
    }

    render() {
        return (
            <React.Fragment>
                <div>
                    <Modal isOpen={this.state.modal} toggle={this.handleToggle}>
                        <ModalBody>
                            { (this.state.modal) ? <Space /> : '' }
                        </ModalBody>
                    </Modal>
                </div>
                <div className="mbee-home">
                    <div className="row align-items-center">
                        <div className="col-md-2">
                        </div>
                        <div className="col-md-8" style={{'text-align': 'center'}}>
                            <div className="row align-items-center splash-row">
                                <div className="col-5" style={{'text-align': 'right'}}>
                                    <img src="/img/logo.png" height="180" alt=""
                                         style={{'margin-bottom': '20px'}} />
                                </div>
                                <div className="col-7" style={{'text-align': 'left'}}>
                                    <h1>MBEE</h1>
                                    <h2>Model-Based Engineering Environment</h2>
                                </div>
                            </div>
                            <div className="home-links">
                                <a href="/organizations" className="home-link">
                                    <div className="home-link-icon">
                                        <i className="fas fa-boxes"></i>
                                    </div>
                                    <div className="home-link-label">
                                        <p>Your Organizations</p>
                                    </div>
                                </a>
                                <a href="/projects" className="home-link">
                                    <div className="home-link-icon">
                                        <i className="fas fa-box"></i>
                                    </div>
                                    <div className="home-link-label">
                                        <p>Your Projects</p>
                                    </div>
                                </a>
                                <a href="/whoami" className="home-link">
                                    <div className="home-link-icon">
                                        <i className="fas fa-user-secret"></i>
                                    </div>
                                    <div className="home-link-label">
                                        <p>You</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div className="col-md-2">
                        </div>
                    </div>
                </div>
            </React.Fragment>

        );
    }
}

ReactDOM.render(<HomePage />, document.getElementById('view'));

