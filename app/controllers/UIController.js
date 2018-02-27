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

const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'config.json'))

/**
 * UIController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines UI-related control functionality.
 */
class UIController 
{

    /**
     * Renders the home page.
     */
    static home(req, res) 
    {
        return res.render('home', {
            'ui': config.ui, 
            'renderer': 'mbee-renderer'
        });
    }


    /**
     * Renders the admin console.
     */
    static admin(req, res) 
    {
        return res.render('home', {
            'ui': config.ui, 
            'renderer': 'admin-renderer'
        });
    }


    /**
     * Renders the login screen.
     */
    static login(req, res) 
    {
        return res.render('login', {'ui': config.ui})
    }
}

module.exports = UIController;