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
const config = require(path.join(__dirname, '..', '..', 'package.json'))['mbee-config'];

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
        console.log('/');
        if (req.session.count) {
            req.session.count++;
        }
        else {
            req.session.count = 1;
        }
        console.log(req.session.count);
        console.log(req.session.token);
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
    static showLoginPage(req, res) 
    {
        return res.render('login', {'ui': config.ui})
    }


    /**
     * Attempts to login the user. If successful, redirect them to the 
     * homepage. Otherwise, send them back to the login screen with error 
     * message.
     */
    static login(req, res) 
    {
        console.log('User authenticated via UI.')
        res.redirect('/');
    }


    /**
     * TODO can this be handled by the auth/BaseStrategy class?
     */
    static isLoggedIn(req, res, next) 
    {

        if (req.user) {
            User.findOne({
                'username': sani.sanitize(req.user.username)
            }, function(err, user) {
                if (err) {
                    // handle error
                    console.log(err);
                    res.redirect('/login');
                }
                else if (!user) {
                    // handle user not found
                    console.log('ERROR: user object in req not found')
                    res.redirect('/login');
                }
                else {
                    // user is logged in, call next
                    next();
                }

            })
        }
    }

}

module.exports = UIController;