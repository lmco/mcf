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
 * OrganizationController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * The OrganizationController class defines static methods for handling
 * organization-related API routes.
 */


var mongoose = require('mongoose');

require('../models/OrganizationModel')
var Organization = mongoose.model('Organization');

class OrganizationController 
{

    /**
     * Gets a list of all organizations and returns them wrapped in an object
     * where the list of organizations corresponses to the object's "orgs" key.
     */

    static getOrgs(req, res) 
    {

        Organization.find(function(err, orgs) {
            if (err)
                res.send(err);
            res.json(orgs)
        });
    }


    /**
     * Takes a list of orgs in the request body and creates those orgs.
     * If the any of the orgs already exist, 
     */

    static postOrgs(req, res) 
    {
        Organization.save(orgList,function(err, orgs) {
            if (err)
                res.send(err)
            res.send("Organizations Saved To Database.")
        });
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
        res.send('Method not implemented for route.');
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     * 
     * See also: DeleteOrg for the singular instance.
     *
     * TODO (jk) - Discuss the possibility of batch delete of orgs by passing 
     * a list of existing orgs. Must define behavior for this will work (e.g. if
     * some deletions succeed and others don't).
     */

    static deleteOrgs(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * Takes an "orgid" parameter in the request URL. Returns the organization 
     * with that ID or an error if that organization does not exist.
     */

    static getOrg(req, res) 
    {
        res.send('Method not implemented for route.');     
    }


    /**
     * Takes an organization in the request params formatted as JSON `. 
     * All fields required by the organization model are expected in the body, 
     * otherwise an error may be returned. Returns the created org if successful.
     */

    static postOrg(req, res) 
    {
        res.send('Method not implemented for route.');
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
        res.send('Method not implemented for route.');
    }


    /**
     * Takes an orgid in the request params and deletes the corresponding 
     * organization. Returns a success message if successful, otherwise an error
     * message is returned.
     */

    static deleteOrg(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * Takes an orgid in the request params and returns a list of the project 
     * objects for that organization. Returns an error message if organization
     * not found or other error occurs.
     */

    static getOrgProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     */

    static postOrgProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     */

    static putOrgProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * This function is not intented to be implemented. It is defined here so that 
     * calls to the corresponding route can be caught and error messages returned 
     * rather than throwing a 500 server error.
     */

    static deleteOrgProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }

}

/**
 * Expose `OrganizationController`
 */
module.exports = OrganizationController;

