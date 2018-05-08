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
const version = require(path.join(__dirname, '..', '..', 'package.json'))['version'];
const config = require(path.join(__dirname, '..', '..', 'package.json'))['config'];
const log = require(path.join(__dirname, '..', 'lib', 'logger.js'));
const sani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));
const libCrypto = require(path.join(__dirname, '..', 'lib', 'crypto.js'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel.js'));
const Org = require(path.join(__dirname, '..', 'models', 'OrganizationModel.js'));

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
        log.info(`GET ${req.originalUrl} requested by ${req.user.username}`);
        return res.render('home', {
            'ui': config.ui, 
            'user': req.user.getPublicData()
        });
    }

    /**
     * Renders the MBEE app page.
     */
    static mbee(req, res) 
    {
        log.info(`GET ${req.originalUrl} requested by ${req.user.username}`)
        console.log(req.params)
        return res.render('mbee', {
            'ui': config.ui, 
            'renderer': 'mbee-renderer',
            'user': req.user.getPublicData(),
            'org': sani.sanitize(req.params.org),
            'project': sani.sanitize(req.params.project)
        });
    }


    /**
     * Renders the admin console.
     */
    static admin(req, res) 
    {
        return res.render('home', {
            'ui': config.ui, 
            'renderer': 'admin-renderer',
            'user': req.user.getPublicData()
        });
    }


    /**
     * Renders the about page.
     */
    static showAboutPage(req, res) 
    {
        let token = libCrypto.inspectToken(req.session.token);
        User.findOne({
            'username': sani.sanitize(token.username)
        })
        .exec(function(err, user) {
            if (err) {
                log.error(err);
            }
            else {
                req.user = user
            }
            var user  = (req.user) ? req.user.username.toString() : 'anonymous';
            log.info(`GET "/about" requested by  ${user}`);
            return res.render('about', {
                'ui': config.ui, 
                'user': req.user,
                'info': {
                    'version': version
                }
            })
        });  
    }


    /**
     * Shows the developer's documentation page.
     */
    static showDevelopersPage(req, res) {
        let token = libCrypto.inspectToken(req.session.token);
        User.findOne({
            'username': sani.sanitize(token.username)
        })
        .exec(function(err, user) {
            if (err) {
                log.error(err);
            }
            else {
                req.user = user
            }
            var user  = (req.user) ? req.user.username.toString() : 'anonymous';
            log.info(`GET "/developers" requested by  ${user}`);
            return res.render('developers', {
                'ui': config.ui, 
                'user': req.user,
                'info': {
                    'version': version
                }
            })
        });
    }


    /**
     * Renders the login screen.
     */
    static showLoginPage(req, res) 
    {
        var user  = (req.user) ? req.user.username.toString() : 'anonymous';
        log.info(`GET "/login" requested by  ${user}`);
        return res.render('login', {'ui': config.ui, 'user': ''})
    }


    /**
     * Attempts to login the user. If successful, redirect them to the 
     * homepage. Otherwise, send them back to the login screen with error 
     * message.
     */
    static login(req, res) 
    {
        var user  = (req.user) ? req.user.username.toString() : 'anonymous';
        log.info(`POST "/login" requested by ${user}. Redirecting to "/" ...`);
        res.redirect('/');
    }


    /**
     * Logs out the user by unsetting the req.user object and the 
     * req.session.token object.
     */
    static logout(req, res) 
    {
        var user  = (req.user) ? req.user.username.toString() : 'anonymous';
        log.info(`GET "/logout" requested by ${user}`);
        req.user = undefined;
        req.session.token = undefined;
        res.redirect('/login');
    }
}

module.exports = UIController;
