/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.App
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description This renders either the authenticated or unauthenticated version of the app,
 * depending on the knowledge of the authentication status.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */

// React modules
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// MBEE modules
import Navbar from '../general/nav-bar.jsx';
import AuthenticatedApp from './AuthenticatedApp.jsx';
import UnauthenticatedApp from './UnauthenticatedApp.jsx';
import Banner from '../general/Banner.jsx';

export default function App(props) {
  const [authenticated, setAuthenticated] = useState(Boolean(window.sessionStorage.getItem('mbee-user')));

  useEffect(() => {
    // eslint-disable-next-line no-undef
    mbeeWhoAmI((err, data) => {
      if (err) {
        setAuthenticated(false);
      }
      else if (data) {
        setAuthenticated(true);
      }
      else {
        setAuthenticated(false);
      }
    });
  }, []);

  return (
    <Router>
      <Banner>
        <Navbar authenticated={authenticated} setAuthenticated={setAuthenticated}/>
        { (authenticated)
          ? <AuthenticatedApp/>
          : <UnauthenticatedApp setAuthenticated={setAuthenticated}/>
        }
      </Banner>
    </Router>
  );
}
