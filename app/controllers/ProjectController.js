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
 * ProjectController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com
 *
 * The ProjectController class defines static methods for 
 * project-related API routes.
 */

class ProjectController 
{

    /**
     * Gets and returns a list of all projects.
     */

    static getProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * Takes a list of projects in the request body and creates those projects.
     * All required fields as defined by the project model are expected, else an
     * error may occur. 
     *
     * TODO (jk) - Define behavior for partial failures
     */
    static postProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * Takes a list of projects in the request body and modifies the existing 
     * projects. Each project object must have a project ID and at least one other
     * field, else no changes will be made.
     *
     * TODO (jk) - Define behavior for partial failures.
     */

    static putProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }


    /**
     * Takes a list of project IDs in the body and deletes those projects.
     *
     * TODO (jk) - Define behavior for partial failures.
     */
    static deleteProjects(req, res) 
    {
        res.send('Method not implemented for route.');
    }

}


/**
 * Expose `ProjectController`
 */
module.exports = ProjectController;
