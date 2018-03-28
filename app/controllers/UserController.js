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

const htmlspecialchars = require('htmlspecialchars');
const sanitize = require('mongo-sanitize');

const package_json = require(path.join(__dirname, '..', '..', 'package.json'));
const config = package_json['mbee-config'];

const API = require(path.join(__dirname, 'APIController'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));

/**
 * UserController.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines User-related control functionality. Specifically, this
 * controller defines the implementation of /users/* API endpoints. 
 */
class UserController 
{

    /**
     * Gets a list of all users and returns their public data in
     * JSON format.
     */
    static getUsers(req, res)
    {
        User.find(function(err, users) {
            // Check if error occured
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            // Convert to public user data
            var publicUsers = [];
            for (var i = 0; i < users.length; i++) {
                publicUsers.push(users[i].getPublicData());
            }

            // Otherwise return 200 and the users' public JSON
            res.header('Content-Type', 'application/json');
            return res.status(200).send(API.formatJSON(publicUsers));
        });

    }


    /**
     * Gets a user by username and returns the user's public JSON data.
     */
    static getUser(req, res) 
    {
        var username = sanitize(htmlspecialchars(req.params['username']));

        User.findOne({
            "username": username
        }, function(err, user) {
            // Check if error occured
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            // Otherwise return 200 and the user's public JSON
            res.header('Content-Type', 'application/json');
            return res.status(200).send(API.formatJSON(user.getPublicData()));
        });

    }


    /**
     * Creates a user. Expects the user data to be in the request body.
     */
    static postUser(req, res) 
    {
        // Error check - make sure the user is defined
        if (!req.user) {
            console.log('Error: req.user is not defined.');
            return req.status(500).send('Internal Server Error');
        }

        // Make sure user is an admin
        if (!req.user.admin) {
            console.log('User is not an admin.');
            return req.status(403).send('Forbidden');
        }

        return req.status(501).send('Not Implemented');

    }


    /**
     * 
     */
    static putUser(req, res)
    {

    }


    /**
     * Deletes a user.
     */
    static deleteUser(req, res)
    {

    }

}

module.exports = UserController;