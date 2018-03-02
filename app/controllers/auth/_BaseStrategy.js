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
 * _BaseStrategy.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 * 
 * This implements a BaseStrategy class that defines the interface expected
 * from an authentication controller.
 */
module.exports = class BaseStrategy 
{

    /**
     * The `BaseStrategy` constructor.
     */
    constructor() 
    {
        this.name = 'base-strategy';
    }


    /**
     * This function will be called for API routes requiring authentication.
     */
    authenticate(req, res, next) 
    {
        // This forces subclasses to implement this method.
        throw new Error('Error: authenticate() method not implemented.');
    }


    /**
     * This should perform login actions such as returning an auth token.
     * It will be called when the `/api/login` route is called.
     * TODO - implement an OAuth token generation function
     */
    doLogin(req, res) {
        // do nothing
        throw new Error('Error: doLogin() method not implemented.');
    }

}
