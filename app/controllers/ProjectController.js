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

/* Node.js Modules */
const path = require('path');

/* Third-party modules */
const htmlspecialchars = require('htmlspecialchars');

/* Local Modules */
const config = require(path.join(__dirname, '..', '..', 'package.json'))['mbee-config'];
const modelsPath = path.join(__dirname, '..', 'models');
const API = require(path.join(__dirname, 'APIController'));
const Organization = require(path.join(modelsPath, 'Organization'));
const Project = require(path.join(modelsPath, 'Project'));


/**
 * ProjectController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * The ProjectController class defines static methods for 
 * project-related API routes.
 */

class ProjectController 
{
    /**
     * Takes an orgid in the request params and returns a list of the project 
     * objects for that organization. Returns an error message if organization
     * not found or other error occurs.
     */

    static getProjects(req, res) 
    {
        var orgid = htmlspecialchars(req.params['orgid']);
        Project.find({'orgid': orgid}, function(err, projects) {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            res.header('Content-Type', 'application/json');
            return res.status(200).send(API.formatJSON(projects));
        });
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     */

    static postProjects(req, res) 
    {
        return res.status(501).send('Not Implemented.');        
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     *
     * TODO (jk) - Figure out how we want to handle a change to an orgid.
     * For now, this assumes orgid won't change and stuff will break if it does
     */

    static putProjects(req, res) 
    {
        return res.status(501).send('Not Implemented.');
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     *
     * TODO (jk) - This may be one of the ugliest functions I've ever written. Fix it.
     */

    static deleteProjects(req, res) 
    {
        return res.status(501).send('Not Implemented.');   
    }


    /**
     * Gets and returns a list of all projects.
     */

    static getProject(req, res) 
    {
        var orgid = htmlspecialchars(req.params['orgid']);
        var projectid = htmlspecialchars(req.params['projectid']);

        Project.find({'id': projectid}, function(err, projects) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            if (projects.length != 1) {
                console.log('Error: Unexpected number of projects found.')
                return res.status(500).send('Internal Server Error');
            }
            if (projects[0]['orgid'] != orgid) {
                console.log('Error: Project orgid does not match URL orgid.')
                return res.status(500).send('Internal Server Error');
            }
            res.header('Content-Type', 'application/json');
            return res.send(API.formatJSON(projects[0]));
        });
    }


    /**
     * Takes a project object in the request body and creates the project.
     *
     * @req.params
     *     orgid
     *     projectid
     *     
     * @req.body
     *     id
     *     name
     *     orgid
     */
    static postProject(req, res) 
    {
        var orgId = htmlspecialchars(req.params['orgid']);
        var projectId = htmlspecialchars(req.params['projectid']);
        var project = req.body;

        // Error check - if project ID exists in body, make sure it matches URI
        if (project.hasOwnProperty('id')) {
            if (htmlspecialchars(project['id']) != projectId) {
                console.log('Project ID in body does not match Project ID in URI.');
                return res.status(400).send('Bad Request');
            }
        }

        // Error check - make sure project ID is valid
        if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(projectId)) {
            console.log('Project ID is not valid.');
            return res.status(400).send('Bad Request');
        }

        // Error check - Make sure project body has a project name
        if (!project.hasOwnProperty('name')) {
            console.log('Project does not have a name.');
            return res.status(400).send('Bad Request');
        }

        var projectName = htmlspecialchars(project['name']);

        // Error check - Make sure project name is valid
        if (!RegExp('^([a-zA-Z0-9-\s])+$').test(projectName)) {
            console.log('Project name is not valid.');
            return res.status(400).send('Bad Request');
        }

        // Error check - If org ID exists in body, make sure it matches URI
        if (project.hasOwnProperty('orgid')) {
            if (htmlspecialchars(project['orgid']) != orgId) {
                console.log('Organization ID in body does not match Organization ID in URI.');
                return res.status(400).send('Bad Request');
            }
        }

        // Create the callback function to create the project
        var createProject = function() {
            // Create the new project and save it
            var new_project = new Project({
                'id': projectId,
                'name': projectName,
                'orgid': orgId
            });
            new_project.save();

            // Return success and the JSON object
            res.header('Content-Type', 'application/json');
            return res.status(201).send(API.formatJSON(new_project));
        }

        // Error check - Make sure the org exists
        Organization.find({'id': orgId}, function(err, orgs) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            if (orgs.length < 1) {
                console.log('Org not found.');
                return res.status(500).send('Internal Server Error');
            }

            // Error check - check if the project already exists
            Project.find({'id': projectId}, function(err, projects) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }
                if (projects.length >= 1) {
                    console.log('Project already exists.');
                    return res.status(500).send('Internal Server Error');
                }

                // If the project does not exist, create it.
                createProject();
            });
        });
    }


    /**
     * Takes an organization ID and project ID in the URI and JSON encoded 
     * project data in the body. Updates the project curresponding to the URI
     * with the data passed in the body.
     *
     * @req.params
     *     orgid        the ID organizatiion containing the project
     *     projectid    the ID of the project to update.
     *
     * @req.body - A single JSON encoded object containing project data
     *     id
     *     name
     */

    static putProject(req, res) 
    {
        var orgId = htmlspecialchars(req.params['orgid']);
        var projectId = htmlspecialchars(req.params['projectid']);
        var project = req.body;

        // Error check - if project ID exists in body, make sure it matches URI
        if (project.hasOwnProperty('id')) {
            if (htmlspecialchars(project['id']) != projectId) {
                console.log('Project ID in body does not match Project ID in URI.');
                return res.status(400).send('Bad Request');
            }
        }

        // Error check - make sure project ID is valid
        if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(projectId)) {
            console.log('Project ID is not valid.');
            return res.status(400).send('Bad Request');
        }

        // Error check - Make sure project body has a project name
        if (!project.hasOwnProperty('name')) {
            console.log('Project does not have a name.');
            return res.status(400).send('Bad Request');
        }

        var projectName = htmlspecialchars(project['name']);

        // Error check - Make sure project name is valid
        if (!RegExp('^([a-zA-Z0-9-\s])+$').test(projectName)) {
            console.log('Project name is not valid.');
            return res.status(400).send('Bad Request');
        }

        // Error check - If org ID exists in body, make sure it matches URI
        if (project.hasOwnProperty('orgid')) {
            if (htmlspecialchars(project['orgid']) != orgId) {
                console.log('Organization ID in body does not match Organization ID in URI.');
                return res.status(400).send('Bad Request');
            }
        }

        // Create the callback function to create the project
        var createProject = function() {
            // Create the new project and save it
            var new_project = new Project({
                'id': projectId,
                'name': projectName,
                'orgid': orgId
            });
            new_project.save();

            // Return success and the JSON object
            res.header('Content-Type', 'application/json');
            return res.status(201).send(API.formatJSON(new_project));
        }

        // The callback function to replace the project
        var replaceProject = function(project) {
            // Currently we only suppoer updating the name
            project['name'] = projectName;
            project.save();

            // Return success and the JSON object
            res.header('Content-Type', 'application/json');
            return res.status(201).send(API.formatJSON(project));
        }

        // Error check - Make sure the org exists
        Organization.find({'id': orgId}, function(err, orgs) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            if (orgs.length < 1) {
                console.log('Org not found.');
                return res.status(500).send('Internal Server Error');
            }

            // Error check - check if the project already exists
            Project.find({'id': projectId}, function(err, projects) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }
                if (projects.length > 1) {
                    console.log('Too many projects found.');
                    return res.status(500).send('Internal Server Error');
                }

                // If project is found, update it
                else if (projects.length == 1) {
                    replaceProject(projects[0]);
                }

                // If the project does not exist, create it.
                createProject();
            });
        });
    }


    /**
     * Takes an organization ID and project ID in the URI and deletes the
     * corresponding project. 
     *
     * @required.params
     *     orgid        the ID of the organization containing the project
     *     projectid    the ID of the project to delete
     *
     * @req.body
     *     N/A
     */
    
    static deleteProject(req, res) 
    {
        var orgId = htmlspecialchars(req.params['orgid']);
        var projectId = htmlspecialchars(req.params['projectid']);

        Project.find({'id': projectId}, function(err, projects) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            if (projects.length != 1) {
                console.log('Unexpected number of projects found');
                return res.status(500).send('Internal Server Error');
            }
            if (projects[0]['orgid'] != orgId) {
                console.log('Project OrgID does not match OrgID in URI.');
                return res.status(500).send('Internal Server Error');   
            }
            Project.findByIdAndRemove(projects[0]['id'], function(err) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }
                else {
                    return res.status(200).send('OK');
                }
            });
        });
    }

}


// Expose `ProjectController`
module.exports = ProjectController;
