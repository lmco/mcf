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
 * Project.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This is a placeholder class for a future model.
 */

class Project
{

    /**
     * A placeholder constructor.
     */
    constructor(_obj) 
    {
        this.id = _obj['id'];
        this.name = _obj['name'];
        this.orgid = _obj['orgid'];
        console.log('Creating a new Project with data:', _obj);
    }


    /**
     * A placeholder save function.
     */
    save() 
    {
        console.log('Saving', this.id, '...');

        var updated = false;
        for (var i = 0; i < ProjData.length; i++) {
            if (ProjData[i]['id'] == this.id) {
                ProjData.splice(i, 1, this);
                updated = true;
            }
        }
        if (!updated) {
            ProjData.push(this)
        }
    }


    /**
     * A placeholder method for the find method.
     */
    static find(_search_obj, callback) 
    {   
        // Make sure we got at least one argument
        if (_search_obj === undefined) {
            throw new Error("Invalid usage of 'find' method.");
        }

        // If no search term, set callback to first object
        if (callback == undefined) {
            callback = _search_obj;
            _search_obj = undefined;
        }

        console.log('Executing search ...')

        if (_search_obj === undefined) {
            callback(null, OrgData);
        }
        else {
            if (_search_obj['id'] != undefined) { 
                var callback_executed = false;
                for (var i = 0; i < ProjData.length; i++) {
                    if (ProjData[i]['id'] == _search_obj['id']) {
                        callback(null, [
                            new Project({
                                id: ProjData[i]['id'],
                                name: ProjData[i]['name'],
                                orgid: ProjData[i]['orgid']
                            })
                        ]);
                        callback_executed = true;
                    }
                } 
                if (!callback_executed) {
                    callback(null, []);
                }
            }
            else if (_search_obj['orgid'] != undefined) {
                var projects = [];
               
                for (var i = 0; i < ProjData.length; i++) {
                    if (ProjData[i]['orgid'] == _search_obj['orgid']) {
                        projects.push(ProjData[i]);
                    }
                } 
                callback(null, projects);
            }
        }   
    }


    /**
     * Does a mock delete of an item by ID.
     */
    static findByIdAndRemove(id, callback) 
    {   
        var callback_executed = false;
        console.log('Deleting', id, '...');
        for (var i = 0; i < ProjData.length; i++) {
            if (ProjData[i]['id'] == id) {
                ProjData.splice(i, 1);
                callback(null);
                callback_executed = true;
            }
        }
        if (!callback_executed) {
            callback('An error occurred');
        }
        
    }

}


// This is a mockup of the org data
var ProjData = [
    new Project({
        "id": "proj1a", 
        "name": "Project 1a",
        "orgid": "org1"
    }), 
    new Project({
        "id": "proj1b", 
        "name": "Project 1b",
        "orgid": "org1"
    }), 
    new Project({
        "id": "proj2a", 
        "name": "Project 2a",
        "orgid": "org2"
    })
];


module.exports = Project;


