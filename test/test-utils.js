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
const Project = M.require('models.project');
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
    newUser = null;

    // Check any admin exist
    User.findOne({ username: userData.username })
    .then((foundUser) => {
      // Check user found
      if (foundUser !== null) {
        // User found, return it
        return resolve(foundUser);
      }

      // User data present, create user
      user = new User({
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
    newAdminUser = null;

    // Check any admin exist
    User.findOne({ username: testData.users[0].adminUsername })
    .then((foundUser) => {
      // Check user found
      if (foundUser !== null) {
        // User found, return it
        return resolve(foundUser);
      }

      // User data present, create user
      user = new User({
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
    // Set hard delete
    hardDelete = true;

    // Initialize the query object
    const deleteQuery = { $or: [] };
    let arrDeletedProjects = [];

    // Find organization to ensure it exists
    findOrg(adminUser, organizationID, true)
    .then((org) => {
      // Hard delete
      Organization.deleteOne({ id: org.id })
      // Delete all projects in that org
      .then(() => {
        // Loop through each org
        Object([arrOrganizations]).forEach((org) => {
          // Ensure user has permissions to delete projects on each org
          if (!org.getPermissions(adminUser).admin && !adminUser.admin) {
            return reject(new M.CustomError(
              `User does not have permission to delete projects in the org ${org.name}.`, 401
            ));
          }
          deleteQuery.$or.push({ org: org._id });
          arrDeletedProjects = arrDeletedProjects.concat(org.projects);
        });

        // If there are no elements to delete
        if (deleteQuery.$or.length === 0) {
          return resolve();
        }

        // Hard delete projects
        if (hardDelete) {
          Project.deleteMany(deleteQuery)
          // Delete elements in associated projects
          .then(() => ElementController.removeElements(reqUser, arrDeletedProjects, hardDelete))
          .then(() => resolve(arrDeletedProjects))
          .catch((error) => reject(error));
        }
      })
      .then(() => resolve(org))
      .catch((error) => reject(error));
    });
  });
}
