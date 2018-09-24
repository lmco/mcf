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
// Node modules
const path = require('path');

// MBEE modules
const Organization = M.require('models.organization');
const User = M.require('models.user');
const testData = require(path.join(M.root, 'test', 'data.json'));
/**
 * @description Helper function to create test non-admin user in
 * MBEE tests.
 */
module.exports.createNonadminUser = function(userData = null) {
  return new Promise((resolve, reject) => {
    // Define new user
    let newUser = null;

    // Check any admin exist
    User.findOne({ username: userData.username })
    .then((foundUser) => {
      // Check user found
      if (foundUser !== null) {
        // User found, return it
        return resolve(foundUser);
      }

      // User data present, create user
      const user = new User({
        username: userData.username,
        password: userData.password,
        fname: userData.fname,
        lname: userData.lname,
        admin: false
      });

      // Save user object to the database
      return user.save();
    })
    .then((user) => {
      // Set new user
      newUser = user;

      // Find the default organization
      return Organization.find({ id: 'default' });
    })
    .then((orgs) => {
      // Add user to default org read/write permissions
      orgs[0].permissions.read.push(newUser._id.toString());
      orgs[0].permissions.write.push(newUser._id.toString());

      // Save the updated org
      return orgs[0].save();
    })
    .then(() => resolve(newUser))
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function to create test admin user in
 * MBEE tests.
 */
module.exports.createAdminUser = function() {
  return new Promise((resolve, reject) => {
    // Define new user
    let newAdminUser = null;

    // Check any admin exist
    User.findOne({ username: testData.users[0].adminUsername })
    .then((foundUser) => {
      // Check user found
      if (foundUser !== null) {
        // User found, return it
        return resolve(foundUser);
      }

      // User data present, create user
      const user = new User({
        username: testData.users[0].adminUsername,
        password: testData.users[0].adminPassword,
        ovider: 'local',
        admin: true
      });

      // Save user object to the database
      return user.save();
    })
    .then((user) => {
      // Set new admin user
      newAdminUser = user;

      // Find the default organization
      return Organization.find({ id: 'default' });
    })
    .then((orgs) => {
      // Add user to default org read/write permissions
      orgs[0].permissions.read.push(newAdminUser._id.toString());
      orgs[0].permissions.write.push(newAdminUser._id.toString());

      // Save the updated org
      return orgs[0].save();
    })
    .then(() => resolve(newAdminUser))
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function to delete test user in
 * MBEE tests.
 */
module.exports.removeUser = function(userData) {
  return new Promise((resolve, reject) => {
    // Find admin user
    User.findOne({ username: userData.username })
    .then((foundUser) => foundUser.remove())
    .then(() => resolve(null))
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function to delete test admin user in
 * MBEE tests.
 */
module.exports.removeAdminUser = function() {
  return new Promise((resolve, reject) => {
    // Find admin user
    User.findOne({ username: testData.users[0].adminUsername })
    .then((foundUser) => foundUser.remove())
    .then(() => resolve(null))
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function to create organization in
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
    .then((_newOrg) => resolve(_newOrg))
    .catch((error) => reject(error));
  });
};

/**
 * @description Helper function to remove organization in
 * MBEE tests.
 */
module.exports.removeOrganization = function(adminUser, organizationID) {
  return new Promise((resolve, reject) => {
    let organization = null;
    // Find organization to ensure it exists
    Organization.find({ id: organizationID, deleted: false })
    .then((org) => {
      organization = org;
      // Hard delete
      return Organization.deleteOne({ id: org.id });
      // Delete all projects in that org
    })
    .then(() => resolve(organization))
    .catch((error) => reject(error));
  });
};
