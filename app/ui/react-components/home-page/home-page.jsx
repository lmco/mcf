/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.home-page
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
 * @description This renders the homepage.
 */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Modal, ModalBody } from 'reactstrap';

import Tile from './tile.jsx';
import Space from '../general-components/space/space.jsx';
import { getRequest } from '../helper-functions/getRequest.js';

class HomePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            modal: false,
            user: null,
            starredProjects: []
        };

        this.handleToggle = this.handleToggle.bind(this);
    }

    componentDidMount() {

        const url = '/api/users/whoami';

        getRequest(`${url}`)
        .then(user => {
            this.setState({user: user});
            if (user.custom.hasOwnProperty('starred_projects')) {
                 const starredProjects = user.custom.starred_projects.map(p => {
                    return (
                        <Tile href={'/' + p} icon={'fas fa-star'}>
                            {p}
                        </Tile>
                    )
                });
                this.setState({starredProjects: starredProjects});
            }
        })
        .catch(err => {
            console.log(err);
        });


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
                    <div className="row">
                        <div className="home-links row">
                            {
                                (this.state.starredProjects.length > 0)
                                    ?  this.state.starredProjects
                                    : ''
                            }
                            <Tile href={'/organizations'} icon={'fas fa-cubes'} id='orgs'>
                                Organizations
                            </Tile>
                            <Tile href={'/projects'} icon={'fas fa-box'} id='projects'>
                                Projects
                            </Tile>
                            <Tile href={'/whoami'} icon={'fas fa-user-alt'} id='user'>
                                User Settings
                            </Tile>
                        </div>
                    </div>
                </div>
            </React.Fragment>

        );
    }
}

ReactDOM.render(<HomePage />, document.getElementById('view'));

