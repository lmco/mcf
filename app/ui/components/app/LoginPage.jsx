/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.app.LoginPage
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This renders the login page.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */

// React modules
import React, { useState } from 'react';

import { login } from './api-client.js';

// MBEE modules
import { useAuth } from '../context/AuthProvider.js';

// Dynamically load Login Modal Message
import uiConfig from '../../../../build/json/uiConfig.json';
const loginModal = uiConfig.loginModal;

export default function LoginPage(props) {
  const { setAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { next } = props;

  const handleUserChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePassChange = (e) => {
    setPassword(e.target.value);
  };

  const doLogin = (e) => {
    // Remove any left over sessions
    window.sessionStorage.removeItem('mbee-user');

    // Close modal if open
    $('#login-warning').modal('hide');

    // Create object to send for authentication
    const form = {
      username: username,
      password: password,
      next: next
    };

    login(form, setError, setAuth);
  };

  // Open the modal if enabled; otherwise login
  const triggerModal = (e) => {
    if ((e.target.id === 'loginBtn' || e.keyCode === 13) && loginModal.on) {
      $('#login-warning').modal({ show: true });
    }
    else if ((e.target.id === 'loginBtn' || e.keyCode === 13) && !loginModal.on) {
      doLogin();
    }
  };

  return (
    <div id="main">
      <div id="view" className="view">
        <div className="container" style={{ maxWidth: '450px' }}>
          { error
            ? (<div className="alert alert-danger alert-dismissible fade show" role="alert"
                   style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)' }}>
                {error}
                <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              </div>)
            : '' }
          <div id="login-form">
            <div className="form-group" >
              <label htmlFor="username">Username</label>
              <input id="username" name="username" type="text" className="form-control"
                     aria-describedby="usernameHelp" placeholder="Enter your username ..."
                     value={username} onChange={handleUserChange}/>
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-control" placeholder="Enter your password ..."
                     value={password} onChange={handlePassChange}/>
            </div>
            <button id="loginBtn" type="button" className="btn btn-primary" onClick={triggerModal}>
              Login
            </button>
          </div>
        </div>
        <div id="login-warning" className="modal" style={{ tabindex: -1 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">NOTICE</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#333' }}>{loginModal.message}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-primary" onClick={doLogin}>Accept and Login</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
