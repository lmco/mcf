/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.api-client.UserService
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Defines the user service.
 */

// MBEE modules
import ApiClient from './ApiClient.js';

class UserService extends ApiClient {

  constructor(authContext) {
    super(authContext, '/api/users');
  }

  async whoami(options = {}) {
    const baseUrl = '/api/users/whoami';

    // Store the result of the request
    const [err, me] = await super.get(options, baseUrl);

    // Set the mbee user session storage item
    if (me) window.sessionStorage.setItem('mbee-user', JSON.stringify(me));
    else window.sessionStorage.removeItem('mbee-user');

    return [err, me];
  }

  async search(data, options = {}) {
    const baseUrl = '/api/users/search';
    return super.search(data, options, baseUrl);
  }

  async password(data, username, options = {}) {
    const baseUrl = `/api/users/${username}/password`;
    options.method = 'PATCH';

    // Store the result of the request
    const [err, result] = await super.makeRequest(data, options, baseUrl);

    // Destroy the session if the user changed their own password
    const sessionUser = window.sessionStorage.getItem('mbee-user');
    if (sessionUser.username === username) {
      const { setAuth } = this.authContext;
      setAuth(false);
      window.sessionStorage.removeItem('mbee-user');
    }

    return [err, result];
  }

}

export default UserService;
