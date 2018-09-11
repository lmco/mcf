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

/**
 * @description Helper function to create test non-admin user for
 * MBEE tests.
 */
module.exports.createNonadminUser = function(userData=null) {
  return new Promise((resolve, reject) => {
    // Check any admin exist
    User.findOne({ username: userData.username })
    .then((foundUser) => {
      // Check user found
      if (foundUser !== null) {
        // User found, return it
        return resolve(foundUser);
      }

      // Define user to be created
      let user;

      // Check passed in user data
      if (userData === null){
        // No data, create default user
        user = new User({
          username: 'nonadminUser',
          password: 'password123',
          fname: 'userFirstname',
          preferredName: 'nonadmin user',
          lname: 'userLastname',
          admin: false
        });
      }
      else{
        // User data present, create user
        user = new User({
          username: userData.username,
          password: userData.password,
          fname: userData.fname,
          lname: userData.lname,
          admin: false
        });
      }

      // Save user object to the database
      return user.save();
    })
    .then((user) => resolve(user))
    .catch((error) => reject(error));

  });
};

/**
 * @description Helper function to create test admin user for
 * MBEE tests.
 */
module.exports.createAdminUser = function() {
  return new Promise((resolve, reject) => {
    // Check any admin exist
    User.findOne({ username: M.config.test.adminUsername })
    .then((foundUser) => {
      // Check user found
      if (foundUser !== null) {
        // User found, return it
        return resolve(foundUser);
      }

      // User not found, create new user
      const user = new User({
        username: M.config.test.adminUsername,
        password: M.config.test.adminPassword,
        provider: 'local',
        admin: true
      });

      // Save user object to the database
      return user.save();
    })
    .then((user) => resolve(user))
    .catch((error) => reject(error));

  });
};

/**
 * @description Helper function to delete test admin user for
 * MBEE tests.
 */
module.exports.removeAdminUser = function() {
  return new Promise((resolve, reject) => {
    // Find admin user
    User.findOne({username: M.config.test.adminUsername})
    .then((foundUser) => foundUser.remove())
    .then(() => resolve(null))
    .catch((error) => reject(error));
  });
}

/**
 * @description Helper function to create organization for
 * MBEE tests.
 */
module.exports.createOrganization = function(adminUser, orgData) {
  return new Promise((resolve, reject) => {
    // Create the new organization
    const newOrg = new Organization({
      id: orgData.id,
      name: orgData.name,
      permissions: {
        admin: [adminUser._id],
        write: [adminUser._id],
        read: [adminUser._id]
      },
      custom: null,
      visibility: 'private'
    });
    newOrg.save()
    .then((newOrg) => resolve(newOrg))
    .catch((error) => reject(error));
  });
}
