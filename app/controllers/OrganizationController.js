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
const API = require(path.join(__dirname, 'APIController'));
const modelsPath = path.join(__dirname, '..', 'models');
const Organization = require(path.join(modelsPath, 'Organization'));
const Project = require(path.join(modelsPath, 'Project'));


/**
 * OrganizationController
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @classdesc The OrganizationController class defines static methods for handling
 * organization-related API routes.
 */

class OrganizationController
{

    /**
     * Gets a list of all organizations and returns them as JSON.
     *
     * @req.params
     *     N/A
     *     
     * @req.body
     *     N/A
     */

    static getOrgs(req, res) 
    {
        // Query all organizations from the database
        Organization.find(function(err, orgs) {
            // If error occurs, log error and return 500 status.
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            // Otherwise return 200 and the orgs
            res.header('Content-Type', 'application/json');
            return res.status(200).send(API.formatJSON(orgs));
        });
    }


    /**
     * TODO (jk) - Discuss the possibility of batch creation of orgs.
     * 
     * @req.params
     *     N/A
     *
     * @req.body
     *     N/A
     */

    static postOrgs(req, res) 
    {
        res.status(501).send('Not Implemented.');
    }


    /**
     * TODO (jk) - Discuss the possibility of batch updates to orgs by passing 
     * a list of existing orgs. Must define behavior for this.
     *
     * @req.params
     *     N/A
     * 
     * @req.body
     *     N/A
     */

    static putOrgs(req, res) 
    {
        res.status(501).send('Not Implemented.');
    }


    /**
     * This function will delete all orgs.
     *
     * TODO (jk) - Discuss and define behavior for this will work or if it is 
     * necessary.
     *
     * @req.params
     *     N/A
     * 
     * @req.body
     *     N/A
     */

    static deleteOrgs(req, res) 
    {
        res.status(501).send('Not Implemented.');
    }


    /**
     * Takes an orgid parameter in the request URI and returns the organization
     * with that ID. 
     *
     * @req.params
     *     orgid    the ID of the organization to get.
     * 
     * @req.body
     *     N/A
     */

    static getOrg(req, res) 
    {
        var orgId = htmlspecialchars(req.params['orgid']);
        Organization.find({'id': orgId}, function(err, orgs) {
            // If error occurs, log it and return 500 status
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            // If we find one org (which we should if it exists)
            if (orgs.length == 1) {
                res.header('Content-Type', 'application/json');
                return res.send(API.formatJSON(orgs[0]));
            }
            else {
                return res.status(500).send('Internal Server Error');
            }   
        });   
    }


    /**
     * Takes an organization in the request body formatted as JSON and an 
     * organization ID in the URI and creates the corresponding organization. 
     * A valid orgid consists of only lowercase letters, numbers, and dashes 
     * and must begin with a letter.
     * 
     * @req.params
     *     orgid            The ID of the organization to create.
     * 
     * @req.body
     *     id (optional)    The organization id. This must match the orgid 
     *                      in the request params.
     *     name             The name of the organization to create.    
     */

    static postOrg(req, res) 
    {
        var orgId = htmlspecialchars(req.params['orgid']);

        // Error check - If body has an org ID, make sure it matches the URI
        if (req.body.hasOwnProperty('id')) {
            var bodyOrgId = htmlspecialchars(req.body['id']);
            if (bodyOrgId != orgId) {
                console.log('Org ID in body does not match Org ID in URI.');
                return res.status(400).send('Bad Request');
            }
        }

        // Error check - Make sure a valid orgid is given
        if (!RegExp('^([a-z])([a-z0-9-]){0,}$').test(orgId)) {
            console.log('Organization ID is not valid.');
            return res.status(400).send('Bad Request');
        }

        // Error check - Make sure organization body has a project name
        if (!req.body.hasOwnProperty('name')) {
            console.log('Organization does not have a name.');
            return res.status(400).send('Bad Request');
        }

        var orgName = htmlspecialchars(req.body['name']);

        // Error check - Make sure org name is valid
        if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(orgName)) {
            console.log('Organization name is not valid.');
            return res.status(400).send('Bad Request');
        }
        
        var createOrganization = function() {
            // Create the new org and save it
            var new_org = new Organization({
                id: htmlspecialchars(req.body['id']),
                name: htmlspecialchars(req.body['name'])
            });
            new_org.save()

            // Return the response message
            res.header('Content-Type', 'application/json');
            return res.status(200).send(API.formatJSON(new_org));
        }
    
        Organization.find({'id': orgId}, function(err, orgs) {
            // If error, log it and return 500
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            // If org already exists, throw an error
            if (orgs.length >= 1) {
                console.log('Organization already exists.');
                return res.status(500).send('Internal Server Error');
            }  
            createOrganization();
        });
    }


    /**
     * Takes an orgid in the URI and JSON encoded data in the body. Updates the
     * org specified by the URI with the data provided in the body.
     * 
     * The organization ID cannot be updated and should not be provided in the 
     * body.
     * 
     * @req.params
     *     orgid            The ID of the organization to create.
     * 
     * @req.body
     *     name             The name of the organization to create.
     */

    static putOrg(req, res) 
    {
        var orgId = htmlspecialchars(req.params['orgid']);

        // If a given property is not an allowed property to be updated,
        // return an error immediately.
        var allowedProperties = ['name'];
        var givenProperties = Object.keys(req.body);
        for (var i = 0; i < givenProperties.length; i++) {
            if (!allowedProperties.includes(givenProperties[i])) {
                return res.status(400).send('Bad Request');
            }
        }
        // If nothing is being changed, return.
        if (givenProperties.length < 1) {
            return res.status(400).send('Bad Request');
        }

        // If name in body, validate the name
        if (req.body.hasOwnProperty('name')) {
            var orgName = htmlspecialchars(req.body['name']);
            // Error check - Make sure org name is valid
            if (!RegExp('^([a-zA-Z0-9-\\s])+$').test(orgName)) {
                console.log('Organization name is not valid.');
                return res.status(400).send('Bad Request');
            }
        }

        var updateOrganization = function(org) {
            // Update the name
            if (req.body.hasOwnProperty('name')) {
                org['name'] =  htmlspecialchars(req.body['name']);
            }
            org.save()

            // Return OK status and the updated org
            res.header('Content-Type', 'application/json');
            return res.status(200).send(API.formatJSON(org));
        }

        Organization.find({'id': orgId}, function(err, orgs) {
            // If error occurs, log it and return 500
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            // If ore than 1 org found
            if (orgs.length > 1) {
                console.log('Too many orgs found with same ID');
                return res.status(500).send('Internal Server Error');
            }
            else if (orgs.length < 1) {
                console.log('Org', orgId, 'does not exist.');
                return res.status(400).send('Internal Server Error');
            } 
            updateOrganization(orgs[0]); 
        });
    }


    /**
     * Takes an orgid in the URI and deletes the corresponding 
     * organization. Returns a success message if successful, otherwise an error
     * message is returned.
     *
     * @req.params
     *     orgid    The ID of the organization to delete.
     * 
     * @req.body
     *     N/A
     */

    static deleteOrg(req, res) 
    {
        var orgid = htmlspecialchars(req.params['orgid']);

        // Do the deletion
        Organization.findByIdAndRemove(orgid, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            else {
                return res.status(200).send('OK');
            }
        });
    
    }

}

// Expose `OrganizationController`
module.exports = OrganizationController;

