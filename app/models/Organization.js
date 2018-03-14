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

module.exports = class Organization
{

    /**
     * A placeholder constructor.
     */
    constructor(_obj) 
    {
        this.id = _obj['id'];
        this.name = _obj['name'];
        console.log('Creating a new Organization with data:', _obj);
    }


    /**
     * A placeholder save function.
     */
    save() 
    {
        console.log('Saving object: ', this.data);
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
            callback(null, [
                new Organization({"id": "org1", "name": "Org 1"}),
                new Organization({"id": "org2", "name": "Org 2"}),
                new Organization({"id": "org3", "name": "Org 3"})
            ]);
        }
        else {
            if (_search_obj['id'] == 'org1') {
                callback(null, [
                    new Organization({"id": "org1", "name": "Org 1"})
                ]);
            }
            else if (_search_obj['id'] == 'org2') {
                callback(null, [
                    new Organization({"id": "org2", "name": "Org 2"})
                ]);
            }
            else if (_search_obj['id'] == 'org3') {
                callback(null, [
                    new Organization({"id": "org3", "name": "Org 3"})
                ]);
            }
            else {
                callback(null, []);   
            }  
        }   
    }


    /**
     * Does a mock delete of an item by ID.
     */
    static findByIdAndRemove(id, callback) 
    {   
        console.log('Mock delete of', id, '...');
        callback(null);
    }


}


