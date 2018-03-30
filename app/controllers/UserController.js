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

const package_json = require(path.join(__dirname, '..', '..', 'package.json'));
const config = package_json['mbee-config'];

const API = require(path.join(__dirname, 'APIController'));
const User = require(path.join(__dirname, '..', 'models', 'UserModel'));

const validators = require(path.join(__dirname, '..', 'lib', 'validators.js'));
const sani = require(path.join(__dirname, '..', 'lib', 'sanitization.js'));

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
     * Accepts a list of JSON-encoded user objects and creates them.
     * Currently not implemented.
     */
    static postUsers(req, res) 
    {
        return res.status(501).send('Not Implemented.');
    }


    /**
     * Accepts a list of JSON-encoded user objects and either creates them
     * or updates them. Currently not implemented.
     */
    static putUsers(req, res) 
    {
        return res.status(501).send('Not Implemented.');
    }


    /**
     * Accepts a list of JSON-encoded user objects containing usernames and 
     * deletes them. Currently not implemented.
     */
    static deleteUsers(req, res) 
    {
        return res.status(501).send('Not Implemented.');
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

        var newUserData = {};

        // Handle username
        if (req.params.hasOwnProperty('username')) {
            // Sanitize the username
            var username = sani.sanitize(req.params['username']);

            // Error check - make sure if username in body it matches params
            if (req.body.hasOwnProperty('username')) {
                if (username != sani.sanitize(req.body['username'])) {
                    console.log('Username in body does not match params.');
                    return req.status(400).send('Bad Request');
                }
            }

            // Error check - make sure username is valid
            if (!RegExp(validators.user.username).test(username)) {
                console.log('Username in req.params is invalid.');
                return req.status(400).send('Bad Request');
            }

            newUserData['username'] = username;
            
        }
        else {
            console.log('Request params does not include a username.');
            return req.status(400).send('Bad Request');
        }

        // Handle password
        if (req.body.hasOwnProperty('password')) {

            // Sanitize the password
            var password = sani.sanitize(req.body['password']);

            // Error check - make sure password is valid
            if (!validators.user.password(password)) {
                console.log('Password is invalid.');
                return req.status(400).send('Bad Request');
            }

            newUserData['password'] = password;
        }
        else {
            console.log('Request body does not include a password.');
            return req.status(400).send('Bad Request');
        } 


        // Handle first name
        if (req.body.hasOwnProperty('fname')) {
            newUserData['fname'] = sani.sanitize(req.body['fname']);
        }

        // Handle last name
        if (req.body.hasOwnProperty('lname')) {
            newUserData['lname'] = sani.sanitize(req.body['lname']);
        }

        User.find({
            "id": newUserData['username']
        }, function(err, users) {
            if (err) {
                console.log(err);
                return req.status(500).send('Internal Server Error');
            }

            // Make sure user doesn't already exist
            if (users.length >= 1) {
                console.log('User already exists.');
                return res.status(500).send('Internal Server Error');
            }


            var newUser = new User(newUserData);
            newUser.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }

                var publicUserData = newUser.getPublicData();
                res.header('Content-Type', 'application/json');
                return res.status(200).send(API.formatJSON(publicUserData));
            })
        });

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

        // Handle username
        if (req.params.hasOwnProperty('username')) {
            // Sanitize the username
            var username = sani.sanitize(req.params['username']);

            // Error check - make sure username is valid
            if (!RegExp(validators.user.username).test(username)) {
                console.log('Username in req.params is invalid.');
                return req.status(400).send('Bad Request');
            }

            User.findOneAndRemove({
                'username': username 
            }, function(err) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }
                else {
                    //res.header('Content-Type', 'application/json');
                    return res.status(200).send('OK');
                }
            });
        }
        else {
            console.log('Request params does not include a username.');
            return req.status(400).send('Bad Request');
        }
    }

}

module.exports = UserController;