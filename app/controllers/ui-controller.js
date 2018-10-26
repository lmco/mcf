/**
 * Classification: UNCLASSIFIED
 *
 * @module  controllers.ui-controller
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
  organizationList,
  organization,
  organizationEdit,
  projectList,
  project,
  projectEdit,
  whoami,
  swaggerDoc,
  showAboutPage,
  showLoginPage,
  login,
  logout
};

// Node modules
const fs = require('fs'); // Used by flight manual. This may change. ~jk
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// MBEE modules
const UserController = M.require('controllers.user-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjController = M.require('controllers.project-controller');
const ElementController = M.require('controllers.element-controller');
const utils = M.require('lib.utils');
const elementSort = M.require('lib.element-sort');
const validators = M.require('lib.validators');

/**
 * @description Renders the home page.
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
 * @description Renders the flight manual.
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
        id: sectionID.replace(/\./g, '-'),
        title: utils.toTitleCase(sectionTitle, true),
        content: fs.readFileSync(`${M.root}/build/fm/${section}`)
      });
    })
    // Render the flight manual
    return utils.render(req, res, 'flight-manual', {
      sections: sections
    });
  });
}

/**
 * @description Renders the organization list page.
 */
function organizationList(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/organizations executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // get all organizations the user is a member of
  OrgController.findOrgs(req.user)
  // Render the organization page with the list of orgs
  .then(orgs => utils.render(req, res, 'organization-list', {
    orgs: orgs,
    title: 'MBEE | Model-Based Engineering Environment'
  }))
  // If error, redirect to home
  .catch(error => {
    M.log.error(error);
    res.redirect('/');
  });
}

/**
 * @description Renders an organization page.
 */
function organization(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/:orgid executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Find organization
  OrgController.findOrg(req.user, req.params.orgid)
  // Render organization page including nav-sidebar
  .then(org => utils.render(req, res, 'organization', {
    name: 'organization',
    title: 'MBEE | Model-Based Engineering Environment',
    org: org,
    sidebar: {
      heading: 'Organization',
      icon: 'fas fa-boxes',
      list: {
        Projects: {
          icon: 'fas fa-box',
          link: '#projects'
        },
        Members: {
          icon: 'fas fa-users',
          link: '#members'
        },
        Settings: {
          icon: 'fas fa-cog',
          link: '#settings'
        }
      }
    }
  }))
  // If error, redirect to organization list
  .catch(err => {
    M.log.error(err);
    return res.redirect('/organizations');
  });
}

/**
 * @description Renders an organization edit/form page.
 */
function organizationEdit(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/:orgid/edit executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Find organization
  OrgController.findOrg(req.user, req.params.orgid)
  .then(org => {
    // Check if user is NOT admin
    if (!req.user.admin
      && !org.permissions.admin.map(u => u.username).includes(req.user.username)) {
      // User is NOT admin, redirect to org page
      return res.redirect(`/${org.id}`);
    }
    // Render organization page
    utils.render(req, res, 'organization-edit', {
      name: 'organization-edit',
      title: 'MBEE | Model-Based Engineering Environment',
      org: org,
      validators: validators.org
    });
  })
  // If error, redirect to organization list
  .catch(err => {
    M.log.error(err);
    return res.redirect('/organizations');
  });
}

/**
 * @description Renders the project list page.
 */
function projectList(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/projects executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Find the requesting user
  UserController.findUser(req.user, req.user.username)
  // Render the project page with the list of projects
  .then(foundUser => {
    // Create list of projects
    const projects = foundUser.proj.read;
    // Loop through list and create reference page for each project
    projects.forEach(proj => {
      // set ref to split of uid and join with forward slashes
      proj.ref = utils.parseUID(proj.uid).join('/');
    });
    utils.render(req, res, 'project-list', {
      title: 'MBEE | Model-Based Engineering Environment',
      projects: projects
    });
  })
  // If error, redirect to home
  .catch(error => {
    M.log.error(error);
    res.redirect('/');
  });
}

/**
 * @description Renders a project page.
 */
function project(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/:orgid/:projectid executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  let proj = null;
  let elements = null;
  // Find organization
  ProjController.findProject(req.user, req.params.orgid, req.params.projectid)
  // Render organization page including nav-sidebar
  .then(foundProject => {
    proj = foundProject;
    return ElementController.findElements(req.user, req.params.orgid, req.params.projectid);
  })
  .then(foundElements => {
    elements = foundElements;
    elements.forEach(element => {
      const uid = utils.parseUID(element.uid);
      element.apiRef = `/api/orgs/${uid[0]}/projects/${uid[1]}/elements/${uid[2]}`;
    });
    const elementTree = elementSort.createElementsTree(elements);
    utils.render(req, res, 'project', {
      name: 'project',
      title: 'MBEE | Model-Based Engineering Environment',
      sidebar: {
        heading: 'Project',
        icon: 'fas fa-box',
        list: {
          Elements: {
            icon: 'fas fa-project-diagram',
            link: '#elements'
          },

          Members: {
            icon: 'fas fa-users',
            link: '#members'
          },
          Settings: {
            icon: 'fas fa-cog',
            link: '#settings'
          }
        }
      },
      project: proj,
      elements: elementTree
    });
  })
  // If error, redirect to organization list
  .catch(err => {
    M.log.error(err);
    return res.redirect('/projects');
  });
}

/**
 * @description Renders a project edit/form page.
 */
function projectEdit(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/:projectid/edit executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }
  // Find Project
  ProjController.findProject(req.user, req.params.orgid, req.params.projectid)
  .then(foundProject => {
    // Check if user is NOT admin
    if (!req.user.admin
      && !foundProject.permissions.admin.map(u => u.username)
      .includes(req.user.username)) {
      // User is NOT admin, redirect to project page
      return res.redirect(`/${foundProject.org.id}/${foundProject.id}`);
    }
    // Render project edit page
    utils.render(req, res, 'project-edit', {
      name: 'project-edit',
      title: 'MBEE | Model-Based Engineering Environment',
      project: foundProject,
      validators: validators.project
    });
  })
  // If error, redirect to project list
  .catch(err => {
    M.log.error(err);
    return res.redirect('/projects');
  });
}

/**
 * @description Renders the current user's page.
 */
function whoami(req, res) {
  // Sanity check: confirm req.user exists
  if (!req.user) {
    M.log.critical(new M.CustomError('/whoami executed with invalid req.user object'));
    // redirect to the login screen
    res.redirect('/login');
  }

  // get all organizations the user is a member of
  UserController.findUser(req.user, req.user.username)
  // Render the project page with the list of projects
  .then(foundUser => {
    utils.render(req, res, 'user', {
      name: foundUser.username,
      title: 'MBEE | Model-Based Engineering Environment',
      sidebar: {
        heading: 'User',
        list: {
          Organizations: {
            icon: 'fas fa-boxes',
            link: '/organizations'
          },
          Projects: {
            icon: 'fas fa-box',
            link: '/projects'
          },
          Settings: {
            icon: 'fas fa-cog',
            link: '#settings'
          }
        }
      },
      user: foundUser
    });
  })
  // If error, redirect to home
  .catch(error => {
    M.log.error(error);
    res.redirect('/');
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
  return utils.render(req, res, 'about', {
    info: {
      version: M.version4
    },
    title: 'About | Model-Based Engineering Environment'
  });
}

/**
 * @description This page renders the login screen. If a get query parameter
 * called "next" is passed in the URL, the next url rendered as a hidden input
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
