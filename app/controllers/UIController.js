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

const path = require('path');

// const version = require(path.join(__dirname, '..', '..', 'package.json'))['version'];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
// const log = require(path.join(__dirname, '..', 'lib', 'logger.js'));
// const sani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));
// const libCrypto = require(path.join(__dirname, '..', 'lib', 'crypto.js'));
// const validators = require(path.join(__dirname, '..', 'lib', 'validators.js'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel.js'));


/**
 * UIController.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description  This class Defines UI-related controller functionallity.
 * It handles the server-side logic for most UI routes and renders the
 * appropriate views.
 */

class UIController {
  /**
   * Renders the home page.
   */

  static home(req, res) {
    M.log.info(`GET ${req.originalUrl} requested by ${req.user.username}`);
    return res.render('home', {
      ui: M.config.server.ui,
      user: req.user.getPublicData()
    });
  }


  /**
   * This renders the primary MBEE application UI.
   * It parses the request paramaters in the URL to determine how to render
   * the MBEE view.
   */

  static mbee(req, res) {
    M.log.info(`GET ${req.originalUrl} requested by ${req.user.username}`);
    return res.render('mbee', {
      ui: M.config.server.ui,
      renderer: 'mbee-renderer',
      user: req.user.getPublicData(),
      org: M.lib.sani.sanitize(req.params.org),
      project: M.lib.sani.sanitize(req.params.project)
    });
  }


  /**
   * This function will render the admin console.
   * The admin console provides a place for global administrators to
   * maintain the MBEE application.
   */

  static admin(req, res) {
    return res.render('home', {
      ui: M.config.server.ui,
      renderer: 'admin-renderer',
      user: req.user.getPublicData()
    });
  }


  /**
   * Renders the about page. This page is accessible even when users are not
   * signed in. Therefore, this function has some logic to identify whether
   * or not the user is logged in.
   */

  static showAboutPage(req, res) {
    const token = M.lib.crypto.inspectToken(req.session.token);
    User.findOne({
      username: M.lib.sani.sanitize(token.username)
    })
      .exec((err, user) => {
        if (err) {
          M.log.error(err);
        }
        else {
          req.user = user;
        }
        // Disables because database document is being directly used
        user = (req.user) ? req.user.username.toString() : 'anonymous'; // eslint-disable-line no-param-reassign
        M.log.info(`GET "/about" requested by  ${user}`);
        return res.render('about', {
          ui: M.config.server.ui,
          user: req.user,
          info: {
            version: M.version
          }
        });
      });
  }


  /**
   * Renders the developers' documentation page.
   * This is expected to move to a plugin eventually.
   */

  static showDevelopersPage(req, res) {
    // log the request
    const user = (req.user) ? req.user.username.toString() : 'anonymous';
    M.log.info(`GET "/developers" requested by  ${user}`);

    // render the developers page
    return res.render('developers', {
      ui: M.config.server.ui,
      user: req.user,
      info: {
        version: M.version
      }
    });
  }


  /**
   * This page renders the login screen. If a get query parameter called
   * "next" is passed in the URL, the next url rendered as a hidden input
   * to tell the login process where to redirect the user after a successful
   * login.
   */
  static showLoginPage(req, res) {
    // log the request
    const user = (req.user) ? req.user.username.toString() : 'anonymous';
    M.log.info(`GET ${req.originalUrl} requested by  ${user}`);

    let next = '';
    // make sure the passed in "next" parameter is valid
    if (RegExp(M.lib.validators.url.next).test(req.query.next)) {
      next = req.query.next;
    }

    // render the login page
    return res.render('login', {
      ui: M.config.server.ui,
      user: '',
      next
    });
  }


  /**
   * This is the final function in the UI authentication chain. First,
   * the authentication conroller's authenticate() and doLogin() functions
   * are called. This function should only get called once login was
   * successful. It handles the appropriate redirect for the user.
   */
  static login(req, res) {
    // log the request
    const user = (req.user) ? req.user.username.toString() : 'anonymous';
    M.log.info(`POST ${req.originalUrl}" requested by ${user}.`);

    // make sure the passed in "next" parameter is valid
    let next = null;
    if (RegExp(M.lib.validators.url.next).test(req.body.next)) {
      next = req.body.next;
    }
    else {
      next = '/';
    }

    // handle the redirect
    M.log.info(`Redirecting to ${next} ...`);
    res.redirect(next);
  }


  /**
   * Logs out the user by unsetting the req.user object and the
   * req.session.token object.
   */

  static logout(req, res) {
    // log the request
    const user = (req.user) ? req.user.username.toString() : 'anonymous';
    M.log.info(`GET "/logout" requested by ${user}`);

    // destroy the session
    req.user = null;
    req.session.destroy();

    // redirect to the login screen
    res.redirect('/login');
  }
}

module.exports = UIController;
