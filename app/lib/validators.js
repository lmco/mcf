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
 * @module  lib/validators
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines common validators.
 */

module.exports.org = {
    id:     '^([a-z])([a-z0-9-]){0,}$',
    name:   '^([a-zA-Z0-9-\\s])+$'
};

module.exports.project = {
    id:     '^([a-z])([a-z0-9-]){0,}$',
    name:   '^([a-zA-Z0-9-\\s])+$'
};

module.exports.user = {
    username: '^([a-z])([a-z0-9_]){0,}$',
    password: function(p) {
        // Error check - Make sure password is a string
        if (typeof(p) !== typeof('')) {
            return false;
        }

        try {
            // At least 8 characters
            var lengthValidator = (p.length >= 8); 
            // At least 1 digit
            var digitsValidator = (p.match(/[0-9]/g).length >= 1);    
            // At least 1 lowercase letter
            var lowercaseValidator = (p.match(/[a-z]/g).length >= 1); 
            // At least 1 uppercase letter  
            var uppercaseValidator = (p.match(/[A-Z]/g).length >= 1);   
            // Validate the password
            return (lengthValidator 
                &&  digitsValidator 
                &&  lowercaseValidator 
                &&  uppercaseValidator) 
                ? true : false;
        }
        catch (error) {
            log.error(error);
            return false;
        }
    }
};

module.exports.url = {
    next:     '^(\/)(?!\/)' // starts with one and only one /
};
