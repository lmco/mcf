/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.ui-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
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
  flightManual,
  whoami,
  organization,
  project,
  swaggerDoc,
  showAboutPage,
  showLoginPage,
  login,
  logout,
  notFound
};

// Node modules
const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// MBEE modules
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');

/**
 * @description Renders the home page.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function home(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/ executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Render the MBEE home screen
  return utils.render(req, res, 'home', {
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * @description Renders the current user's page.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function whoami(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/whoami executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  utils.render(req, res, 'user', {
    name: 'user',
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * @description Renders the organization page.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function organization(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/ executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Render the MBEE home screen
  return utils.render(req, res, 'organization', {
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * @description Renders the project page.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function project(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/ executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Render the MBEE home screen
  return utils.render(req, res, 'project', {
    title: 'MBEE | Model-Based Engineering Environment'
  });
}

/**
 * @description Renders the flight manual.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function flightManual(req, res) {
  // Read the flight manual sections from the doc directory
  fs.readdir(`${M.root}/build/fm`, (err, files) => {
    if (err) {
      M.log.error(err);
      return res.status(500).send('Internal Server Error.');
    }

    // Turn the file names into section IDs and titles
    const sections = [];
    files.filter(fname => fname.endsWith('.html')).forEach(section => {
      const sectionID = section.replace('.html', '');
      const sectionTitle = sectionID.replace(/-/g, ' ');
      sections.push({
        id: sectionID.replace(/\./g, '-').replace(':', ''),
        title: utils.toTitleCase(sectionTitle, true),
        content: fs.readFileSync(`${M.root}/build/fm/${section}`)
      });
    });
    // Render the flight manual
    return utils.render(req, res, 'flight-manual', {
      sections: sections
    });
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
 * @description Renders the swagger doc.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
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
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function showAboutPage(req, res) {
  return utils.render(req, res, 'about', {
    info: {
      version: M.version,
      build: M.build,
      commit: M.commit
    },
    title: 'About | Model-Based Engineering Environment'
  });
}

/**
 * @description This page renders the login screen. If a get query parameter
 * called "next" is passed in the URL, the next url rendered as a hidden input
 * to tell the login process where to redirect the user after a successful
 * login.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
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
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
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
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function logout(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/logout executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // destroy the session
  req.user = null;
  req.session.destroy();

  // redirect to the login screen
  res.redirect('/login');
}

/**
 * @description This is  for pages that were not found.
 *
 * @param {Object} req - Request express object
 * @param {Object} res - Response express object
 */
function notFound(req, res) {
  // render the 404 not found page
  return utils.render(req, res, '404');
}
