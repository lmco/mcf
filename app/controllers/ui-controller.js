/**
 * Classification: UNCLASSIFIED
 *
 * @module  controllers.ui_controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Austin J Bieber <austin.j.bieber@lmco.com>
 *
 * @description This implements the behavior and logic for the user interface.
 * All UI routes map to this controller which in turn uses other controllers to
 * handle other object behaviors.
 */

// Expose UI controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  home,
  mbee,
  admin,
  swaggerDoc,
  showAboutPage,
  renderFlightManual,
  renderJSDoc,
  showLoginPage,
  login,
  logout
};

// Node modules
const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// MBEE modules
const User = M.require('models.user');
const crypto = M.require('lib.crypto');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');

/**
 * Renders the home page.
 */
function home(req, res) {
  return utils.render(req, res, 'home', {
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * This renders the primary MBEE application UI.
 * It parses the request parameters in the URL to determine how to render
 * the MBEE view.
 * // TODO: Remove this in prc-001, keep in masters MBX-370
 */
function mbee(req, res) {
  return utils.render(req, res, 'mbee', {
    org: sani.sanitize(req.params.org),
    project: sani.sanitize(req.params.project),
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * This function will render the admin console.
 * The admin console provides a place for global administrators to
 * maintain the MBEE application.
 * // TODO: Remove this in prc-001, keep in masters MBX-370
 */
function admin(req, res) {
  return utils.render(req, res, 'admin', {
    title: 'Admin | Model-Based Engineering Environment'
  });
}

/**
 * @description Generates the Swagger specification based on the Swagger JSDoc
 * in the API routes file.
 */
function swaggerSpec() {
  return swaggerJSDoc({
    swaggerDefinition: {
      info: {
        title: 'MBEE API Documentation',       // Title (required)
        version: M.version                     // Version (required)
      }
    },
    apis: [
      path.join(M.root, 'app', 'api-routes.js') // Path to the API docs
    ]
  });
}

/**
 * GET /api/doc
 *
 * @description Renders the swagger doc.
 */
function swaggerDoc(req, res) {
  return utils.render(req, res, 'swagger', {
    swagger: swaggerSpec(),
    title: 'API Documentation | Model-Based Engineering Environment'
  });
}

/**
 * @description Renders the about page. This page is accessible even when users are not
 * signed in. Therefore, this function has some logic to identify whether
 * or not the user is logged in.
 */
function showAboutPage(req, res) {
  const token = crypto.inspectToken(req.session.token);
  User.findOne({
    username: sani.sanitize(token.username)
  })
  .exec((err, user) => {
    if (err) {
      M.log.error(err);
    }
    else {
      req.user = user;
    }
    // Disables because database document is being directly used
    return utils.render(req, res, 'about', {
      info: {
        version: M.version4
      },
      title: 'About | Model-Based Engineering Environment'
    });
  });
}

/**
 * @description Renders the documentation.
 * // TODO: Remove this in prc-001, keep in masters MBX-370
 */
function renderFlightManual(req, res) {
  if (!req.params.hasOwnProperty('page')) {
    return res.redirect('flight-manual/index.html');
  }
  const page = sani.html(req.params.page);
  // renter the page
  return utils.render(req, res, 'fm', {
    content: fs.readFileSync(`${M.root}/build/doc/${page}`, 'utf8')
  });
}

/**
 * @description Renders the developer documentation.
 * // TODO: evaluate rather to remove this in prc-001, keep in masters MBX-370
 */
function renderJSDoc(req, res) {
  if (!req.params.hasOwnProperty('page')) {
    return res.redirect('developers/index.html');
  }
  const page = sani.html(req.params.page);
  // renter the page
  return utils.render(req, res, 'jsdoc', {
    content: fs.readFileSync(`${M.root}/build/doc/${page}`, 'utf8')
  });
}

/**
 * @description This page renders the login screen. If a get query parameter called
 * "next" is passed in the URL, the next url rendered as a hidden input
 * to tell the login process where to redirect the user after a successful
 * login.
 */
function showLoginPage(req, res) {
  let next = '';
  // make sure the passed in "next" parameter is valid
  if (RegExp(validators.url.next).test(req.query.next)) {
    next = req.query.next;
  }

  // render the login page
  return utils.render(req, res, 'login', {
    title: 'Login | Model-Based Engineering Environment',
    next: next,
    err: req.flash('loginError')
  });
}

/**
 * @description This is the final function in the UI authentication chain. First,
 * the authentication controller's authenticate() and doLogin() functions
 * are called. This function should only get called once login was
 * successful. It handles the appropriate redirect for the user.
 */
function login(req, res) {
  // make sure the passed in "next" parameter is valid
  let next = null;
  if (RegExp(validators.url.next).test(req.body.next)) {
    next = req.body.next;
  }
  else if (req.user.custom.hasOwnProperty('homepage')) {
    next = req.user.custom.homepage;
  }
  else {
    next = '/';
  }

  // handle the redirect
  M.log.info(`Redirecting to ${next} ...`);
  res.redirect(next);
}

/**
 * @description Logs out the user by un-setting the req.user object and the
 * req.session.token object.
 */
function logout(req, res) {
  // destroy the session
  req.user = null;
  req.session.destroy();

  // redirect to the login screen
  res.redirect('/login');
}
