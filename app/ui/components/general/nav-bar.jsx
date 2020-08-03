/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.general.nav-bar
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner James Eckstein
 *
 * @author Leah De Laurell
 * @author Jake Ursetta
 *
 * @description This renders the nav bar.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
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

// Define component
class MbeeNav extends Component {

  /* eslint-enable no-unused-vars */

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      isOpen: false,
      user: null,
      width: 0,
      height: 0,
      error: null
    };

    // Bind component functions
    this.toggle = this.toggle.bind(this);
    this.setComponentSize = this.setComponentSize.bind(this);
    this.sessionDestroy = this.sessionDestroy.bind(this);
  }

  componentDidMount() {
    // Add event listener for window sizing
    window.addEventListener('resize', this.setComponentSize);
    // eslint-disable-next-line no-undef
    mbeeWhoAmI((err, data) => {
      if (err) {
        this.setState({ error: err.responseText });
      }
      else {
        this.setState({ user: data });
      }
    });

    // Set component size
    this.setComponentSize();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.authenticated !== nextProps.authenticated) {
      if (nextProps.authenticated === true) {
        // eslint-disable-next-line no-undef
        mbeeWhoAmI((err, data) => {
          if (err) {
            this.setState({ user: null, error: err.responseText });
          }
          else {
            this.setState({ user: data });
          }
        });
      }
      else {
        this.setState({ user: null });
      }
    }
  }

  componentWillUnmount() {
    // Remove event listener on window
    window.removeEventListener('resize', this.setComponentSize);
  }

  // Define initialization of component size function
  setComponentSize() {
    // Set states
    this.setState({
      width: this.refs.navbar.clientWidth,
      height: this.refs.navbar.clientHeight
    });
  }

  // Define the open and close function
  toggle() {
    this.setState({
      // set open state
      isOpen: !this.state.isOpen
    });
  }

  /* eslint-disable class-methods-use-this */
  sessionDestroy() {
    window.sessionStorage.removeItem('mbee-user');
    this.props.setAuthenticated(false);
    fetch('/api/logout');
  }
  /* eslint-enable class-methods-use-this */

  render() {
    let setNavbarSize;

    if (this.state.width > 776) {
      setNavbarSize = 'mbee-navbar';
    }
    else {
      setNavbarSize = 'small-screen-navbar';
    }

    return (
      <div ref='navbar' style={{ width: '100%' }}>
        <Navbar className={setNavbarSize} dark expand='md'>
          { /* Create the MBEE Logo on navbar */ }
          <NavbarBrand href="/">
            <img src='/img/logo.png' />
            { /* Change title based on width of window */ }
            {(this.state.width > 900) ? 'Model Based Engineering Environment' : 'MBEE'}
          </NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse isOpen={this.state.isOpen} navbar>
            <Nav className='ml-auto' navbar>
              { /* Create links in navbar for documentation drop down */ }
              <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret>
                  Docs
                </DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem href='/doc/flight-manual'>
                    Flight Manual
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem href='/doc/index.html'>
                    JSDoc Documentation
                  </DropdownItem>
                  <DropdownItem href='/doc/api'>
                    API Documentation
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
              { // Create link to login or logout
                (this.state.user === null)
                  ? <NavLink href='/login'>Login</NavLink>
                  : (
                    <UncontrolledDropdown nav inNavbar>
                      <DropdownToggle nav caret>
                        <i className='fas fa-user-circle'/>
                      </DropdownToggle>
                      <DropdownMenu right>
                        <Link to='/'>
                          <DropdownItem>Home</DropdownItem>
                        </Link>
                        <Link to='/profile'>
                          <DropdownItem>Profile</DropdownItem>
                        </Link>
                        <Link to='/about'>
                          <DropdownItem>About</DropdownItem>
                        </Link>
                        <DropdownItem divider />
                        {(!this.state.user.admin)
                          ? ''
                          : (<React.Fragment>
                            <Link to='/admin'><DropdownItem>Admin Console</DropdownItem></Link>
                            <DropdownItem divider />
                          </React.Fragment>)
                        }
                        <DropdownItem onClick={this.sessionDestroy}>Log Out</DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                  )
              }
              <NavItem>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
      </div>
    );
  }

}

export default MbeeNav;
