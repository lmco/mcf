/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.api-client.ApiClientProvider
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Defines the api client class.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/require-jsdoc */

// React modules
import React, { createContext, useContext } from 'react';

// MBEE modules
import UserService from '../api-client/UserService.js';
import { useAuth } from './AuthProvider.js';


const apiClientContext = createContext();

export function ApiClientProvider(props) {
  const authContext = useAuth();
  const userService = new UserService(authContext);
  const value = {
    userService
  };
  return <apiClientContext.Provider value={value} {...props}/>;
}

export function useApiClient() {
  const context = useContext(apiClientContext);
  if (!context) throw new Error('');
  return context;
}
