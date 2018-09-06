/**
 * Classification: UNCLASSIFIED
 *
 * @module  test.test-utils.js
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 * <br/>
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.<br/>
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author  Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Helper function for MBEE test.
 * - Used to create users, organizations, projects, elements in the database.
 * - Assumes database connection already estabished
 *
 * This function takes the complexity out of MBEE tests,
 * making MBEE tests easier to read and run.
 *
 */
// Load node modules
const path = require('path');
const fs = require('fs');

// Load MBEE modules
const Organization = M.require('models.organization');
const Project = M.require('models.project');

const User = M.require('models.user');
const db = M.require('lib.db');

// check if local-strategy or ldap
  // check if ldap
    // check if user in the local database
      // in database
        // authenticate()
      // if not in database
        // CreateUser()
        // authenticate()

// else local strategy
  // check in database
    // in database
      // authenticate()


/**
 * @description Helper function to create non-admin user for
 * MBEE tests.
 */
module.exports.createNonadminUser = function(username='bob'){
  console.log("test-utils.js");
  // Create a new User object
  const user = new User({
    username: username,
    password: 'password',
    fname: 'bobFirstname',
    preferredName: 'The Flash',
    lname: 'allen',
    admin:false
  });

  // Save user object to the database
  user.save((error) => {
    if (error!=null){
      throw error;
    }
  });

};

/**
 * @description Helper function to create admin user for
 * MBEE tests.
 */
module.exports.createAdminUser = function(username='admin'){
  // Create a new User object
  const user = new User({
    username: username,
    password: 'admin',
    fname: 'adminFirstname',
    preferredName: 'AdminPreferredName',
    lname: 'adminLastname',
    admin:true
  });

  // Save user object to the database
  user.save((error) => {
    if (error!=null){
      throw error;
    }
  });

};

/**
 * @description Helper function to create organization for
 * MBEE tests.
 */
module.exports.createOrganization = function(adminUser, orgId='avengers'){
  // Create the new organization
  const newOrg = new Organization({
    id: orgID,
    name: orgName,
    permissions: {
      admin: [user._id],
      write: [user._id],
      read: [user._id]
    },
    custom: null,
    visibility: 'private'
  });

  // Save user object to the database
  newOrg.save((saveErr) => {
    if (saveErr!=null){
    }
  });

};
