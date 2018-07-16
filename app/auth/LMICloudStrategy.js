/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module auth.lmi-cloud-strategy
 *
 * @authorized Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file implements our authentication strategy for cloud-based
 * deployments on the LMI.
 */

const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const LocalStrategy = M.require('auth.LocalStrategy');
const LDAPStrategy = M.require('auth.LDAPStrategy');
const User = M.load('models/User');

/**
 * LMICloudStrategy
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc This class defines authentication in the LMI cloud environment.
 */
class LMICloudStrategy {

  /******************************************************************************
   *  LMI-CLOUD Authentication Implementations                                  *
   ******************************************************************************/

  /**
   * Handles basic-style authentication. This function gets called both for
   * the case of a basic auth header or for login form input. Either way
   * the username and password is provided to this function for auth.
   */
  static handleBasicAuth(req, res, username, password) {
    return new Promise((resolve, reject) => {
      // Search locally for the user
      User.find({
        username: username,
        deletedOn: null
      })
      .populate('orgs.read orgs.write orgs.admin proj.read proj.write proj.admin')
      .exec((err, users) => { // eslint-disable-line consistent-return
        // Check for errors
        if (err) {
          return reject(err);
        }
        // If user found and their provider is local,
        // do local authentication
        if (users.length === 1 && users[0].provider === 'local') {
          LocalStrategy.handleBasicAuth(req, res, username, password)
          .then(localUser => resolve(localUser))
          .catch(localErr => reject(localErr));
        }

        // User is not found locally
        // or is found and has the LMICloud provider,
        // try LDAP authentication
        else if (users.length === 0 || (users.length === 1 && users[0].provider === 'ldap')) {
          LDAPStrategy.handleBasicAuth(req, res, username, password)
          .then(ldapUser => resolve(ldapUser))
          .catch(ldapErr => reject(ldapErr));
        }
        // This should never actually be hit
        else {
          M.log.debug('Found Users: ');
          M.log.debug(users);
          return reject(new Error('More than one User found'));
        }
      });
    });
  }

  /**
   * @description  This function implements handleTokenAuth called in the auth.js library file.
   * The purpose of this function is to implement authentication of a user who has
   * passed in a session token or bearer token. This particular instance just implements the same
   * tokenAuth provided by the Local Strategy.
   *
   * @example
   * AuthController.handleTokenAuth(req, res, _token)
   *   .then(user => {
   *   // do something with authenticated user
   *   })
   *   .catch(err => {
   *     console.log(err);
   *   })
   *
   * @param req The request object from express
   * @param res The response object from express
   * @param _token The token the user is attempting to authenticate with.
   * @returns Promise The local database User object or an error.
   */
  static handleTokenAuth(req, res, _token) {
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      LocalStrategy.handleTokenAuth(req, res, _token)
      .then(user => resolve(user))
      .catch(handleTokenAuthErr => reject(handleTokenAuthErr));
    });
  }

  /**
   * @description  This function implements doLogin called in the auth.js library file.
   * The purpose of this function is to preform session or token setup for the node
   * application so that users can be authorized via token after logging in. This particular
   * implementation uses the Local Strategy doLogin function.
   *
   * @param req The request object from express
   * @param res The response object from express
   * @param next The callback to continue in the express authentication flow.
   */
  static doLogin(req, res, next) {
    LocalStrategy.doLogin(req, res, next);
  }

}

module.exports = LMICloudStrategy;
