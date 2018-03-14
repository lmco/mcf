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
 * OrganizationController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * The OrganizationController class defines static methods for handling
 * organization-related API routes.
 */

class OrganizationController 
{

    /**
     * Gets a list of all organizations and returns them wrapped in an object
     * where the list of organizations corresponses to the object's "orgs" key.
     */

    static getOrgs(req, res) 
    {
        Organization.find(function(err, orgs) {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }

            return res.send(
                JSON.stringify(orgs, null, config.server.json.indent)
            );
        });
    }


    /**
     * Takes a list of orgs in the request body and creates those orgs.
     * If the any of the orgs fail, the whole request fails.
     * If any of the orgs already exist, the request fails.
     */

    static postOrgs(req, res) 
    {
        var orgs = req.body;
        var new_orgs = [];
        for (var i = 0; i < orgs.length; i++) {
            // Try to create each org
            try {
                // If org already exists, throw an error
                // TODO (jk) - Determine if asynch will cause problems here
                Organization.find({
                    'id': htmlspecialchars(orgs[i]['id'])
                }, function(err, found) {
                    if (found.length >= 1) {
                        var id_string = htmlspecialchars(orgs[i]['id']).toString();
                        throw new Error('Org with id ' + id_string + ' already exists');
                    }
                });

                // Push onto new orgs list
                new_orgs.push(
                    new Organization({
                        id: htmlspecialchars(orgs[i]['id']),
                        name: htmlspecialchars(orgs[i]['name'])
                    })
                );
            } 
            // Catch errors and return 500 if anything goes wrong
            catch (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
        }

        // This should never happen but is here for extra safe error checking.
        if (new_orgs.length !== orgs.length) {
            console.log('Error: new_orgs.length does not match orgs.length');
            return res.status(500).send('Internal Server Error');
        }

        // If all went well, save new orgs
        for (var i = 0; i < new_orgs.length; i++) {
            new_orgs[i].save()
        }

        // Return success message and org objects
        res.send(
            JSON.stringify({
                "message": "New orgs successfully created", 
                "orgs": new_orgs
            }, null, config.server.json.indent)
        );
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     * 
     * See also: PutOrg for the singular instance.
     *
     * TODO (jk) - Discuss the possibility of batch updates to orgs by passing 
     * a list of existing orgs. Must define behavior for this.
     */

    static putOrgs(req, res) 
    {
        var orgs = req.body;
        console.log(orgs);
        var updated_orgs = [];
        for (var i = 0; i < orgs.length; i++) {
            // Try to create each org
            try {
                // If org already exists, throw an error
                // TODO (jk) - Determine if asynch will cause problems here 
                // and find cleaner way to write this
                Organization.find({
                    'id': htmlspecialchars(orgs[i]['id'])
                }, 
                function(err, found) {

                    // This should never happen, the data model should prevent it.
                    // But just in case...we check for it.
                    if (found.length > 1) {
                        throw new Error('Critical Error: Multiple orgs found with same ID.');
                    }
                    // If org not found
                    else if (found.length < 1) {
                        throw new Error('Org not found. Request failed.');
                    }
                    // We found one org - this is what would be expected for a proper request
                    else {
                        // Update the org data
                        var org = found[0];                 // the existing org
                        var props = Object.keys(orgs[i]);   // properties in the passed-in JSON org
                        // Update each property for the existing org
                        // Note: if the existing org doesn't already have that property, this will fail
                        for (var j = 0; j < props.length; j++) {
                            org[props[j]] = htmlspecialchars(orgs[i][props[j]]);   
                        }
                        // push to our updated orgs array
                        updated_orgs.push(org);
                    }
                });
            } 
            // Catch errors and return 500 if anything goes wrong
            catch (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
        }

        // This should never happen but is here for extra safe error checking.
        if (updated_orgs.length !== orgs.length) {
            console.log('Error: new_orgs.length does not match orgs.length');
            return res.status(500).send('Internal Server Error');
        }

        // If all went well, save new orgs
        for (var i = 0; i < updated_orgs.length; i++) {
            updated_orgs[i].save()
        }

        // Return success message and org objects
        res.send(
            JSON.stringify({
                "message": "Orgs successfully updated.", 
                "orgs": updated_orgs
            }, null, config.server.json.indent)
        );
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     * 
     * See also: DeleteOrg for the singular instance.
     *
     * TODO (jk) - Discuss  anddefine behavior for this will work (e.g. if
     * some deletions succeed and others don't). 
     */

    static deleteOrgs(req, res) 
    {
        var orgs = req.body;
        var deleted_orgs = [];
        var errors = false;

        // Do the deletion
        for (var i = 0; i < orgs.length; i++) {
            Organization.findByIdAndRemove(
                htmlspecialchars(orgs[i]['id']), 
                function (err) {
                    if (err) {
                        console.log(err);
                        errors = true;
                        return res.status(500).send('Internal Server Error');
                    }
                    deleted_orgs.push(orgs[i]);
                }
            );
        }

        // Verify deletion occured
        for (var i = 0; i < deleted_orgs.length; i++) {
            Organization.find({
                "id": htmlspecialchars(orgs[i]['id'])
            }, 
            function (err, found) {
                if (err) {
                    console.log(err);
                    errors = true;
                    return res.status(500).send('Internal Server Error');
                }
                if (found.length >= 1) {
                    console.log('Org did not get deleted.');
                    errors = true;
                    return res.status(500).send('Internal Server Error');
                }
            });
        }


        // FIXME: This is sort of a workaround for the scope problem introduced
        // by the returns occuring in callbacks. Fix this.
        if (!errors) {
            // Return success message and org objects
            res.send(
                JSON.stringify({
                    "message": "Orgs removed.", 
                    "orgs": deleted_orgs
                }, null, config.server.json.indent)
            );
        }
    }


    /**
     * Takes an "orgid" parameter in the request URL. Returns the organization 
     * with that ID or an error if that organization does not exist.
     */

    static getOrg(req, res) 
    {
        // For now, I'm using the find method because that was the interface
        // that Jake and I agreed on. If we use mongoose, we can use something 
        // like a "findOne" method
        // TODO (jk) - Replace this with proper method call once module is decided.
        Organization.find({
            "id": htmlspecialchars(req.params['orgid'])
        },
        function(err, orgs) {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }

            if (orgs.length == 1) {
                return res.send(
                    JSON.stringify(orgs[0], null, config.server.json.indent)
                );
            }
            else {
                return res.status(500).send('Internal Server Error');
            }

            
        });   

    }


    /**
     * Takes an organization in the request params formatted as JSON `. 
     * All fields required by the organization model are expected in the body, 
     * otherwise an error may be returned. Returns the created org if successful.
     */

    static postOrg(req, res) 
    {
        // Error check
        var params_id = htmlspecialchars(req.params['orgid']);
        var body_id = htmlspecialchars(req.body['id']); 
        if (params_id != body_id) {
            console.log('Body does not match URI');
            return res.status(400).send('Bad Request');
        }

        var org = req.body;
        
        // This try catch will handle things like invalid body format/data as
        // well as errors thrown in the callback or other method errors.
        try {
            // TODO (jk) - Determine if asynch will cause problems here
            Organization.find({
                'id': htmlspecialchars(org['id'])
            }, function(err, found) {
                // If org already exists, throw an error
                if (found.length >= 1) {
                    var id_string = htmlspecialchars(org['id']).toString();
                    throw new Error('Org with id ' + id_string + ' already exists');
                }

                // Create the new org and save it
                var new_org = new Organization({
                    id: htmlspecialchars(org['id']),
                    name: htmlspecialchars(org['name'])
                });
                new_org.save()

                // Return the response message
                return res.send(
                    JSON.stringify({
                        "message": "New org successfully created", 
                        "orgs": new_org
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
     * Takes an orgid in the request params and an organization JSON object in the 
     * request body, updates the 
     * existing organization with the provided information. The request body must
     * include an organization ID and at least one other field or else nothing will
     * be update. Returns the updated object if the update succeeds, otherwise 
     * returns an error message.
     */

    static putOrg(req, res) 
    {
        var org = req.body;
        // This try catch will handle things like invalid body format/data as
        // well as errors thrown in the callback or other method errors.
        try {
            // TODO (jk) - Determine if asynch will cause problems here
            Organization.find({
                'id': htmlspecialchars(req.params['orgid'])
            }, function(err, found) {
                // If org already exists, throw an error
                if (found.length > 1) {
                    throw new Error('Too many orgs found with same ID');
                }
                else if (found.length < 1) {
                    var id_string = htmlspecialchars(req.params['orgid']).toString();
                    throw new Error('Org with id ' + id_string + ' does not exist.');
                } 

                // Update properties and save
                var updated = found[0];            // the existing org
                var props = Object.keys(org);      // properties in the passed-in JSON org
                // Update each property for the existing org
                // Note: if the existing org doesn't already have that property, this will fail
                for (var j = 0; j < props.length; j++) {
                    updated[props[j]] = htmlspecialchars(org[props[j]]);   
                }
                updated.save()

                // Return the response message
                return res.send(
                    JSON.stringify({
                        "message": "Org successfully updated", 
                        "orgs": updated
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
     * Takes an orgid in the request params and deletes the corresponding 
     * organization. Returns a success message if successful, otherwise an error
     * message is returned.
     */

    static deleteOrg(req, res) 
    {
        var orgid = htmlspecialchars(req.params['orgid']);
        var deleted_orgs = [];
        var errors = false;

        // Do the deletion
        Organization.findByIdAndRemove(orgid, function (err) {
            if (err) {
                console.log(err);
                errors = true;
                return res.status(500).send('Internal Server Error');
            }
        });
        
        // Verify deletion occured
        Organization.find({"id": orgid}, function (err, found) {
            if (err) {
                console.log(err);
                errors = true;
                return res.status(500).send('Internal Server Error');
            }
            if (found.length >= 1) {
                console.log('Org did not get deleted.');
                errors = true;
                return res.status(500).send('Internal Server Error');
            }
        });
        


        // FIXME: This is sort of a workaround for the scope problem introduced
        // by the returns occuring in callbacks. Fix this.
        if (!errors) {
            // Return success message and org objects
            return res.send(
                JSON.stringify({
                    "message": "Org removed.", 
                    "org": orgid
                }, null, config.server.json.indent)
            );
        }
    }


    /**
     * Takes an orgid in the request params and returns a list of the project 
     * objects for that organization. Returns an error message if organization
     * not found or other error occurs.
     */

    static getOrgProjects(req, res) 
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

    static postOrgProjects(req, res) 
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

    static putOrgProjects(req, res) 
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
                                // Note: if the existing org doesn't already have that property, this will fail
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

    static deleteOrgProjects(req, res) 
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

}

/**
 * Expose `OrganizationController`
 */
module.exports = OrganizationController;

