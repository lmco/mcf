/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.Index
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This is the entrypoint for the app.  It wraps the app in several provider
 * components that make data easily available to all children components without the need
 * for passing variables through props.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React modules
import React from 'react';
import ReactDOM from 'react-dom';

// MBEE modules
import App from './app/App.jsx';


ReactDOM.render(<App />, document.getElementById('main'));
