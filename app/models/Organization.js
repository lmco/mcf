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
 * Organization.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This is a placeholder class for a future model.
 */

class Organization
{

    /**
     * A placeholder constructor.
     */
    constructor(_obj) 
    {
        this.id = _obj['id'];
        this.name = _obj['name'];
        this.projects = _obj['projects'] || [];
        console.log('Creating a new Organization with data:', _obj);
    }


    /**
     * A placeholder save function.
     */
    save() 
    {
        console.log('Saving', this.id, '...');


        var updated = false;
        for (var i = 0; i < OrgData.length; i++) {
            if (OrgData[i]['id'] == this.id) {
                OrgData.splice(i, 1, this);
                updated = true;
            }
        }
        if (!updated) {
            OrgData.push(this)
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
            var callback_executed = false;
            for (var i = 0; i < OrgData.length; i++) {
                if (OrgData[i]['id'] == _search_obj['id']) {
                    var org_copy = new Organization({
                        id: OrgData[i]['id'],
                        name: OrgData[i]['name'],
                        projects: OrgData[i]['projects']
                    });
                    callback(null, [org_copy]);
                    callback_executed = true;
                }
            } 
            if (!callback_executed) {
                callback(null, []);
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
        for (var i = 0; i < OrgData.length; i++) {
            if (OrgData[i]['id'] == id) {
                OrgData.splice(i, 1);
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
var OrgData = [
    new Organization({
        "id": "org1", 
        "name": "Org 1",
        "projects": ["proj1a", "proj1b"]
    }), 
    new Organization({
        "id": "org2", 
        "name": "Org 2",
        "projects": ["proj2a"]
    }), 
    new Organization({
        "id": "org3", 
        "name": "Org 3",
        "projects": []
    })
];


module.exports = Organization;


