/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components
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
 * @description This renders the nav bar.
 */

// React Modules
import React, { Component } from 'react';
import ReactDom from 'react-dom';
import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
    Nav,
    NavItem,
    NavLink,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem } from 'reactstrap';

// MBEE Modules
import { ajaxRequest } from '../helper-functions/ajaxRequests.js';

// Define component
class MbeeNav extends Component {
    constructor(props) {
        // Initialize parent props
        super(props);

        // Initialize state props
        this.state = {
            isOpen: false,
            user: null,
            width: 0,
            height: 0
        };

        // Bind component functions
        this.toggle = this.toggle.bind(this);
        this.setComponentSize = this.setComponentSize.bind(this);
    }

    componentDidMount() {
        // Add event listener for window sizing
        window.addEventListener('resize', this.setComponentSize);

        // Initialize url
        const url = '/api/users/whoami';

        // Confirm if user exists
        ajaxRequest('GET', url)
        .then(user => {
            // Set user state
            this.setState({user: user});
        })
        .catch(err => {

        });

        // Set component size
        this.setComponentSize();
    }

    componentWillUnmount() {
        // Remove event listener on window
        window.removeEventListener('resize', this.setComponentSize);
    }

    // Define initialization of component size function
    setComponentSize() {
        // Set states
        this.setState(
            {
                width: this.refs.navbar.clientWidth,
                height: this.refs.navbar.clientHeight
            })
    }

    // Define the open and close function
    toggle() {
        this.setState({
            // set open state
            isOpen: !this.state.isOpen
        });
    }

    render() {
        return (
            <div ref="navbar" style={{width: '100%'}}>
                <Navbar color="light" light expand="md">
                    {/*Create the MBEE Logo on navbar*/}
                    <NavbarBrand href="/">
                        <img src="/img/logo-alt.png" />
                        {/*Change title based on width of window*/}
                        {(this.state.width > 900) ? 'Model Based Engineering Environment' : 'MBEE'}
                    </NavbarBrand>
                    <NavbarToggler onClick={this.toggle} />
                    <Collapse isOpen={this.state.isOpen} navbar>
                        <Nav className="ml-auto" navbar>
                            {/*Create links in navbar for documentation drop down*/}
                            <UncontrolledDropdown nav inNavbar>
                                <DropdownToggle nav caret>
                                    Documentation
                                </DropdownToggle>
                                <DropdownMenu right>
                                    <DropdownItem href="/doc/flight-manual">
                                        Flight Manual
                                    </DropdownItem>
                                    <DropdownItem divider />
                                    <DropdownItem href="/doc/developers">
                                        JSDoc Documentation
                                    </DropdownItem>
                                    <DropdownItem href="/doc/api">
                                        API Documentation
                                    </DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                            {/*Create about page link*/}
                            <NavItem>
                                <NavLink href="/about">About</NavLink>
                            </NavItem>
                            <NavItem>
                                {/*Check if user exists*/}
                                {(this.state.user === null)
                                    // Create link to login or logout
                                    ? <NavLink href="/login">Login</NavLink>
                                    : <NavLink href="/logout">Logout</NavLink>
                                }
                            </NavItem>
                        </Nav>
                    </Collapse>
                </Navbar>
            </div>
        );
    }
}

// Render the navbar on the nav html element
ReactDom.render(<MbeeNav />, document.getElementById('nav'));
