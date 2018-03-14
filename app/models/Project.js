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
        this.data = _obj
        console.log('Creating a new Project with data:', this.data)
    }


    /**
     * A placeholder save function.
     */
    save() 
    {
        console.log('Saving object: ', this.data)
    }


    /**
     * A placeholder method for the find method.
     */
    find(_search_obj, callback) 
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

        if (_search_obj !== undefined) {
            callback(null, [
                {"id": "proj1", "name": "Project 1"},
                {"id": "proj2", "name": "Project 2"}
            ]);
        }
        else {
            callback(null, [
                {"id": "proj1", "name": "Project 1"},
                {"id": "proj2", "name": "Project 2"},
                {"id": "proj3", "name": "Project 3"}
            ]);    
        }
        
    }


}


