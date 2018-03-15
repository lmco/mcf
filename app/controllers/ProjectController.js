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
const config = require(path.join(__dirname, '..', '..', 'config.json'))
const modelsPath = path.join(__dirname, '..', 'models');
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
            return res.send(
                JSON.stringify(projects, null, config.server.json.indent)
            );
        });
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     */

    static postProjects(req, res) 
    {
        var orgid = htmlspecialchars(req.params['orgid']);
        var projects = req.body;
        
        try {
            // Find the org first
            Organization.find({'id': orgid}, function(err, orgs) {

                // Error check
                if (err) {
                    throw new Error('An error occured finding Org by ID');
                }
                // Error check - make sure we only get one org
                if (orgs.length != 1) {
                    throw new Error('Error: Unexpected number of orgs found.')
                }

                // For convenience
                var org = orgs[0];

                // Loop over projects
                var new_projects = [];
                for (var i = 0; i < projects.length; i++) {
                    // Get and sanitize user input
                    var project = projects[i];
                    var project_id = htmlspecialchars(project['id']);
                    var project_name = htmlspecialchars(project['name']);
                    var project_orgid = org['id'];

                    // Create the new project object and push it to our new projects list
                    var new_project = new Project({
                        'id': project_id,
                        'name': project_name,
                        'orgid': project_orgid
                    });
                    new_projects.push(new_project);
                    org.projects.push(project_id); // Update org accordingly 
                } 

                // Save changes and return results
                for (var i = 0; i < new_projects.length; i++) {
                    new_projects[i].save();
                }
                org.save();

                // Return results
                return res.send(
                    JSON.stringify({
                        "message": "Projects added successfully",
                        "projects": new_projects
                    }, null, config.server.json.indent)
                );

            });
        
        }
        catch (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }        
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
        var orgid = htmlspecialchars(req.params['orgid']);
        var projects = req.body;
        
        try {
            // Find the org first
            Organization.find({'id': orgid}, function(err, orgs) {

                // Error check
                if (err) {
                    throw new Error('An error occured finding Org by ID');
                }
                // Error check - make sure we only get one org
                if (orgs.length != 1) {
                    throw new Error('Error: Unexpected number of orgs found.')
                }

                // For convenience
                var org = orgs[0];

                // Loop over projects
                var updated_projects = [];
                for (var i = 0; i < projects.length; i++) {
                    // Get and sanitize user input
                    var project = projects[i];
                    var project_id = htmlspecialchars(project['id']);;

                    // Only remove if project is under this org
                    if (org.projects.includes(project_id)) {
                        // find and remove
                        Project.find({'id': project_id}, function(err, found) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send('Internal Server Error');
                            }

                            // Update each project
                            for (var j = 0; j < found.length; j++) {
                                var updated_project = found[j];
                                var props = Object.keys(projects[i]);   // properties in the passed-in JSON org
                                // Update each property for the existing org
                                // TODO (jk) - Fix per conversation with Jake.
                                for (var k = 0; k < props.length; k++) {
                                    updated_project[props[k]] = htmlspecialchars(projects[i][props[k]]);   
                                }
                                updated_projects.push(updated_project);
                            }
                        });
                    }
                } 

                // Save changes and return results
                for (var i = 0; i < updated_projects.length; i++) {
                    updated_projects[i].save();
                }

                // Return results
                return res.send(
                    JSON.stringify({
                        "message": "Projects updated successfully",
                        "projects": updated_projects
                    }, null, config.server.json.indent)
                );
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error');
        } 
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
        var orgid = htmlspecialchars(req.params['orgid']);
        var projects = req.body;

        try {
            Organization.find({'id': orgid}, function(err, orgs) {
                // Error check
                if (err) {
                    throw new Error('An error occured finding Org by ID');
                }
                // Error check - make sure we only get one org
                if (orgs.length != 1) {
                    throw new Error('Error: Unexpected number of orgs found.')
                }
                // For convenience
                var org = orgs[0];
                // Loop over projects and remove them
                var deleted_projects = [];
                var errors = false;
                for (var i = 0; i < projects.length; i++) {

                    var project_id = htmlspecialchars(projects[i]['id']);

                    // Only remove if project is under this org
                    if (org.projects.includes(project_id)) {
                        // find and remove
                        Project.findByIdAndRemove(project_id, function(err) {
                            if (err) {
                                console.log(err);
                                errors = true;
                                return res.status(500).send('Internal Server Error');
                            }

                            // Verify deletion occured
                            Project.find({"id": project_id}, function (err, found) {
                                if (err) {
                                    console.log(err);
                                    errors = true;
                                    return res.status(500).send('Internal Server Error');
                                }
                                if (found.length >= 1) {
                                    console.log('Project did not get deleted.');
                                    errors = true;
                                    return res.status(500).send('Internal Server Error');
                                }
                            });

                            // add to deleted projects
                            deleted_projects.push(project_id);
                        })
                    }

                    // Remove the project from the org
                    org.projects.splice(org.projects.indexOf(project_id), 1);
                    org.save();
                } 

                // Return results
                return res.send(
                    JSON.stringify({
                        "message": "Projects removed",
                        "projects": deleted_projects
                    }, null, config.server.json.indent)
                );
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }        
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
            return res.send(
                JSON.stringify(projects[0], null, config.server.json.indent)
            );
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
        if (!RegExp('^([a-z0-9-])+$').test(projectId)) {
            console.log('Project ID is not valid.');
            return res.status(400).send('Bad Request');
        }

        // Error check - Make sure project body has a project name
        if (!project.hasOwnProperty('name')) {
            console.log('Project does not have a name.');
            return res.status(400).send('Bad Request');
        }

        // Error check - If project ID exists in body, make sure it matches URI
        if (project.hasOwnProperty('id')) {
            if (htmlspecialchars(project['id']) != projectId) {
                console.log('Project ID in body does not match Project ID in URI.');
                return res.status(400).send('Bad Request');
            }
        }

        var projectName = htmlspecialchars(project['name']);

        // Error check - Make sure project ID is valid
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
            return res.status(201).send(new_project);
        }

        // Error check - Make sure the org exists
        Organization.find({'id': orgId}, function(err, orgs) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            if (orgs.length != 1) {
                console.log('An unexpected number of orgs were found.');
                return res.status(500).send('Internal Server Error');
            }
            createProject();
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
     */

    static putProject(req, res) 
    {
        res.status(501).send('Not Implemented.');
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


/**
 * Expose `ProjectController`
 */
module.exports = ProjectController;
