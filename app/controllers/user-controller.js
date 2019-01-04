/**
 * Classification: UNCLASSIFIED
 *
 * @module controllers.user-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Provides an abstraction layer on top of the User model that
 * implements controller logic and behavior for Users.
 */

// Expose user controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  find,
  create,
  update,
  remove
};

// Node.js Modules
const assert = require('assert');

// MBEE Modules
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const User = M.require('models.user');
const sani = M.require('lib.sanitization');
const utils = M.require('lib.utils');

/**
 * @description This function finds one or many users.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {Array/String} users - The users to find. Can either be an array of
 * user ids, a single user id, or not provided, which defaults to every user
 * being found.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported options are the boolean 'archived' and
 * the string 'populate'
 *
 * @return {Promise} resolve - Array of found user objects
 *                   reject - error
 *
 * @example
 * find({User}, ['user1', 'user2'], { populate: 'createdBy' })
 * .then(function(users) {
 *   // Do something with the found users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function find(requestingUser, users, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const saniUsers = (users !== undefined)
      ? sani.sanitize(JSON.parse(JSON.stringify(users)))
      : undefined;

    // Set options if no users were provided, but options were
    if (typeof users === 'object' && users !== null && !Array.isArray(users)) {
      options = users; // eslint-disable-line no-param-reassign
    }

    // Initialize valid options
    let archived = false;
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'archived' is supplied, ensure it's a boolean
        if (options.hasOwnProperty('archived')) {
          assert.ok(typeof options.archived === 'boolean', 'The option \'archived\''
            + ' is not a boolean.');
          archived = options.archived;
        }

        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(typeof options.populate === 'string', 'The option \'populate\''
            + ' is not a string.');
          populateString = options.populate;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define searchQuery
    const searchQuery = { archived: false };
    // If the archived field is true, remove it from the query
    if (archived) {
      delete searchQuery.archived;
    }

    // Check the type of the users parameter
    if (Array.isArray(saniUsers) && saniUsers.every(u => typeof u === 'string')) {
      // An array of usernames, find all
      searchQuery._id = { $in: saniUsers };
    }
    else if (typeof saniUsers === 'string') {
      // A single username
      searchQuery._id = saniUsers;
    }
    else if (!((typeof saniUsers === 'object' && saniUsers !== null) || saniUsers === undefined)) {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for finding users.', 400, 'warn');
    }
    // Find the users
    User.find(searchQuery)
    .populate(populateString)
    .then((foundUser) => resolve(foundUser))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This functions creates one or many users.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {Array/Object} users - Either an array of objects containing user data
 * or a single object containing user data to create.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the string 'populate'.
 *
 * @return {Promise} resolve - Array of created user objects
 *                   reject - error
 *
 * @example
 * create({User}, [{User1}, {User2}, ...], { populate: 'createdBy' })
 * .then(function(users) {
 *   // Do something with the newly created users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function create(requestingUser, users, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const saniUsers = sani.sanitize(JSON.parse(JSON.stringify(users)));
    let createdUsers = [];

    // Initialize valid options
    let populateString = '';
    let populate = false;

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to create users.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(typeof options.populate === 'string', 'The option \'populate\''
            + ' is not a string.');
          populateString = options.populate;
          populate = true;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define array to store user data
    let usersToCreate = [];

    // Check the type of the users parameter
    if (Array.isArray(saniUsers) && saniUsers.every(u => typeof u === 'object')) {
      // users is an array, create many users
      usersToCreate = saniUsers;
    }
    else if (typeof saniUsers === 'object') {
      // users is an object, create a single user
      usersToCreate = [saniUsers];
    }
    else {
      // users is not an object or array, throw an error
      throw new M.CustomError('Invalid input for creating users.', 400, 'warn');
    }

    // Create array of usernames for lookup
    const arrUsernames = [];

    // Check that each user has a username, and add to arrUsernames
    try {
      let index = 1;
      usersToCreate.forEach((user) => {
        // Ensure each user has a username and that its a string
        assert.ok(user.hasOwnProperty('username'), `User #${index} does not have a username`);
        assert.ok(typeof user.username === 'string', `User #${index}'s username is not a string.`);
        arrUsernames.push(user.username);
        user._id = user.username;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery to search for any existing, conflicting users
    const searchQuery = { _id: { $in: arrUsernames } };

    // Find any existing, conflicting users
    User.find(searchQuery, '_id')
    .then((foundUsers) => {
      // If there are any foundUsers, there is a conflict
      if (foundUsers.length > 0) {
        // Get arrays of the foundUsers's usernames
        const foundUserUsernames = foundUsers.map(u => u._id);

        // There are one or more users with conflicting usernames
        throw new M.CustomError('Users with the following usernames already exist'
            + ` [${foundUserUsernames.toString()}].`, 403, 'warn');
      }

      // For each object of user data, create the user object
      const userObjects = usersToCreate.map((u) => {
        const userObj = new User(u);
        userObj.lastModifiedBy = reqUser._id;
        userObj.createdBy = reqUser._id;
        userObj.updatedOn = Date.now();
        return userObj;
      });

        // TODO: Do we need to check if provider === local && password === undefined

        // Create the users
        // NOTE: .create() is being used here instead of.insertMany() so that the
        // pre save middleware is called for password validation
      return User.create(userObjects);
    })
    .then((_createdUsers) => {
      // Set function-wide createdUsers;
      createdUsers = _createdUsers;

      // Find the default organization
      return Organization.findOne({ _id: M.config.server.defaultOrganizationId });
    })
    .then((defaultOrg) => {
      // Add each created user to the default org with read/write
      createdUsers.forEach((user) => {
        defaultOrg.permissions[user._id] = ['read', 'write'];
      });

      // Mark the default orgs permissions as modified
      defaultOrg.markModified('permissions');

      // Save the updated default org
      return defaultOrg.save();
    })
    .then(() => {
      // If user wants populated users, find and populate
      if (populate) {
        return resolve(User.find({ _id: { $in: arrUsernames } })
        .populate(populateString));
      }

      return resolve(createdUsers);
    })
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function updates one or many users.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {Array/Object} users - Either an array of objects containing updates
 * to users, or a single object containing updates.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently the only supported option is the string 'populate'.
 *
 * @return {Promise} resolve - Array of updated user objects
 *                   reject - error
 *
 * @example
 * update({User}, [{Updated User 1}, {Updated User 2}...], { populate: 'createdBy' })
 * .then(function(users) {
 *   // Do something with the newly updated users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function update(requestingUser, users, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const saniUsers = sani.sanitize(JSON.parse(JSON.stringify(users)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let foundUsers = [];
    let usersToUpdate = [];

    // Initialize valid options
    let populateString = '';

    // Ensure parameters are valid
    try {
      // Ensure that requesting user has an _id field
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');

      if (options) {
        // If the option 'populate' is supplied, ensure it's a string
        if (options.hasOwnProperty('populate')) {
          assert.ok(typeof options.populate === 'string', 'The option \'populate\''
            + ' is not a string.');
          populateString = options.populate;
        }
      }
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Check the type of the users parameter
    if (Array.isArray(saniUsers) && saniUsers.every(u => typeof u === 'object')) {
      // users is an array, update many users
      usersToUpdate = saniUsers;
    }
    else if (typeof saniUsers === 'object') {
      // users is an object, update a single user
      usersToUpdate = [saniUsers];
    }
    else {
      throw new M.CustomError('Invalid input for updating users.', 400, 'warn');
    }

    // Create list of usernames
    const arrUsernames = [];
    try {
      let index = 1;
      usersToUpdate.forEach((user) => {
        // Ensure each user has a username and that its a string
        assert.ok(user.hasOwnProperty('username'), `User #${index} does not have a username.`);
        assert.ok(typeof user.username === 'string', `User #${index}'s username is not a string.`);
        arrUsernames.push(user.username);
        user._id = user.username;
        index++;
      });
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Create searchQuery
    const searchQuery = { _id: { $in: arrUsernames } };

    // Find the users to update
    User.find(searchQuery)
    .then((_foundUsers) => {
      // Set the function-wide foundUsers
      foundUsers = _foundUsers;

      // Convert usersToUpdate to JMI type 2
      const jmiType2 = utils.convertJMI(1, 2, usersToUpdate);
      const promises = [];
      // Get array of editable parameters
      const validFields = User.getValidUpdateFields();

      // For each found user
      foundUsers.forEach((user) => {
        const updateUser = jmiType2[user._id];
        // Remove username and _id field from update object
        delete updateUser.username;
        delete updateUser._id;


        // Error Check: if user currently archived, they must first be unarchived
        if (user.archived && updateUser.archived !== false) {
          throw new M.CustomError(`User [${user._id}] is archived. `
              + 'Archived objects cannot be modified.', 403, 'warn');
        }

        // For each key in the updated object
        Object.keys(updateUser).forEach((key) => {
          // Check if the field is valid to update
          if (!validFields.includes(key)) {
            throw new M.CustomError(`User property [${key}] cannot `
                + 'be changed.', 400, 'warn');
          }

          // If the type of field is mixed
          if (User.schema.obj[key].type.schemaName === 'Mixed') {
            // Only objects should be passed into mixed data
            if (typeof updateUser !== 'object') {
              throw new M.CustomError(`${key} must be an object`, 400, 'warn');
            }

            // Add and replace parameters of the type 'Mixed'
            utils.updateAndCombineObjects(user[key], updateUser[key]);

            // Mark mixed fields as updated, required for mixed fields to update in mongoose
            // http://mongoosejs.com/docs/schematypes.html#mixed
            user.markModified(key);

            // Set the updateUser mixed field to the modified version
            updateUser[key] = user[key];
          }
          // Set archivedBy if archived field is being changed
          else if (key === 'archived') {
            // User cannot archive or unarchive themselves
            if (user._id === reqUser._id) {
              throw new M.CustomError('User cannot archive or unarchive themselves', 403, 'warn');
            }

            // If the user is being archived
            if (updateUser[key] && !user[key]) {
              updateUser.archivedBy = reqUser;
            }
            // If the user is being unarchived
            else if (!updateUser[key] && user[key]) {
              updateUser.archivedBy = null;
            }
          }
        });

        // Update last modified field
        updateUser.lastModifiedBy = reqUser;

        // Update the user
        promises.push(user.updateOne(updateUser));
      });

      // Return when all promises have been completed
      return Promise.all(promises);
    })
    .then(() => User.find(searchQuery)
    .populate(populateString))
    .then((foundUpdatedUsers) => resolve(foundUpdatedUsers))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}

/**
 * @description This function removes one or many users.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {Array/String} users - The users to remove. Can either be an array of
 * user ids or a single user id.
 * @param {Object} options - An optional parameter that provides supported
 * options. Currently there are no supported options.
 *
 * @return {Promise} resolve - Array of deleted users usernames
 *                   reject - error
 *
 * @example
 * remove({User}, ['user1', 'user2'])
 * .then(function(users) {
 *   // Do something with the deleted users
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
function remove(requestingUser, users, options) {
  return new Promise((resolve, reject) => {
    // Sanitize input parameters and create function-wide variables
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const saniUsers = sani.sanitize(JSON.parse(JSON.stringify(users)));
    let foundUsers = [];
    let foundUsernames = [];

    // Ensure parameters are valid
    try {
      // Ensure the requesting user has an _id and is a system admin
      assert.ok(reqUser.hasOwnProperty('_id'), 'Requesting user is not populated.');
      assert.ok(reqUser.admin, 'User does not have permissions to delete users.');
    }
    catch (msg) {
      throw new M.CustomError(msg, 403, 'warn');
    }

    // Define searchQuery and memberQuery
    const searchQuery = {};
    const memberQuery = {};

    // Check the type of the users parameter
    if (Array.isArray(saniUsers) && saniUsers.every(u => typeof u === 'string')) {
      // An array of usernames, remove all
      searchQuery._id = { $in: saniUsers };
    }
    else if (typeof saniUsers === 'string') {
      // A single username
      searchQuery._id = saniUsers;
    }
    else {
      // Invalid parameter, throw an error
      throw new M.CustomError('Invalid input for removing users.', 400, 'warn');
    }

    // Find the users to delete
    User.find(searchQuery)
    .then((_foundUsers) => {
      // Set function-wide foundUsers and foundUsernames
      foundUsers = _foundUsers;
      foundUsernames = foundUsers.map(u => u._id);

      // Create memberQuery
      foundUsers.forEach((user) => {
        memberQuery[`permissions.${user.username}`] = 'read';
      });

      // Check that user can remove each user
      foundUsers.forEach((user) => {
        // If trying to delete the self, throw an error
        if (user._id === reqUser._id) {
          throw new M.CustomError('User cannot delete self.', 403, 'warn');
        }
      });

      // Find any organizations the users were apart of
      return Organization.find(memberQuery);
    })
    .then((orgs) => {
      const promises = [];
      // For each org, remove users from permissions lists
      orgs.forEach((org) => {
        foundUsernames.forEach((user) => {
          delete org.permissions[user];
        });

        org.markModified('permissions');

        // Add save operation to promise array
        promises.push(org.save());
      });

      // Save all orgs and return once all are saved
      return Promise.all(promises);
    })
    // Find any projects the users were apart of
    .then(() => Project.find(memberQuery))
    .then((projects) => {
      const promises = [];
      // For each project, remove users from permissions lists
      projects.forEach((proj) => {
        foundUsernames.forEach((user) => {
          delete proj.permissions[user];
        });

        proj.markModified('permissions');

        // Add save operation to promise array
        promises.push(proj.save());
      });

      // Save all projects and return once all are saved
      return Promise.all(promises);
    })
    // Remove the users
    .then(() => User.deleteMany(searchQuery))
    // Return the deleted users
    .then(() => resolve(foundUsernames))
    .catch((error) => reject(M.CustomError.parseCustomError(error)));
  });
}
