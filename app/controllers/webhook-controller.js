/**
 * @classification UNCLASSIFIED
 *
 * @module controllers.webhook-controller
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @author Connor Doyle <connor.p.doyle@lmco.com>
 *
 * @description This implements the behavior and logic for webhooks.
 * It also provides function for interacting with webhooks.
 */

// Expose webhook controller functions
// Note: The export is being done before the import to solve the issues of
// circular references between controllers.
module.exports = {
  find,
  create,
  update,
  remove
};

// NPM modules
const uuidv4 = require('uuid/v4');

// Node modules

// MBEE modules
const Webhook = M.require('models.webhook');
const Org = M.require('models.organization');
const Project = M.require('models.project');
const Branch = M.require('models.branch');
const utils = M.require('lib.utils');
const errors = M.require('lib.errors');
const helper = M.require('lib.controller-utils');
const sani = M.require('lib.sanitization');
const permissions = M.require('lib.permissions');
const EventEmitter = M.require('lib.events');


/**
 * @description This function finds one or many webhooks. Depending on the parameters provided,
 * this function will find a single webhook by ID, multiple webhooks by ID, or all the webhooks
 * a user has access to, at varying levels of scope. A user can specify that they want to find
 * webhooks at the system level, org level, project level, or branch level. The user making
 * the request must have respective admin permissions at the level of the request, or be a
 * system-wide admin.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string|null} [organizationID] - The ID of the owning organization.
 * @param {string|null} [projectID] - The ID of the owning project.
 * @param {string|null} [branchID] - The ID of the owning branch.
 * @param {(string|string[])} [webhooks] - The webhooks to find. Can either be an array of
 * webhook ids, a single webhook id, or not provided, which defaults to every webhook at the
 * system/org/project/branch level being found.
 * @param {object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return of the found
 * objects. By default, no fields are populated.
 * @param {boolean} [options.includeArchived = false] - If true, find results will include
 * archived objects.
 * @param {string[]} [options.fields] - An array of fields to return. By default includes the
 * _id. To NOT include a field, provide a '-' in front.
 * @param {number} [options.limit = 0] - A number that specifies the maximum number of
 * documents to be returned to the user. A limit of 0 is equivalent to setting no limit.
 * @param {number} [options.skip = 0] - A non-negative number that specifies the number of
 * documents to skip returning. For example, if 10 documents are found and skip is 5, the first
 * 5 documents will NOT be returned.
 * @param {boolean} [options.lean = false] - A boolean value that if true returns raw JSON
 * instead of converting the data to objects.
 * @param {string} [options.sort] - Provide a particular field to sort the results by. To sort
 * in reverse order, provide a '-' in front.
 * @param {string} [options.server] - Search only for server-wide webhooks.
 * @param {string} [options.type] - Search for webhooks with a specific type.
 * @param {string} [options.name] - Search for webhooks with a specific name.
 * @param {string} [options.createdBy] - Search for webhooks with a specific createdBy value.
 * @param {string} [options.lastModifiedBy] - Search for elements with a specific lastModifiedBy
 * value.
 * @param {string} [options.archived] - Search only for archived elements.  If false, only
 * returns unarchived elements.  Overrides the includeArchived option.
 * @param {string} [options.archivedBy] - Search for elements with a specific archivedBy value.
 * @param {string} [options.custom....] - Search for any key in custom data. Use dot notation
 * for the keys. Ex: custom.hello = 'world'.
 *
 * @returns {Promise<object[]>} Array of found element objects.
 *
 * @example
 * find({User}, 'orgID', 'projID', 'branchID', ['webhook1', 'webhook2'], { type: 'Outgoing' })
 * .then(function(webhooks) {
 *   // Do something with the found webhookss
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function find(requestingUser, organizationID, projectID, branchID, webhooks, options) {
  try {
    // Set options if no webhooks were provided, but options were
    if (typeof webhooks === 'object' && webhooks !== null && !Array.isArray(webhooks)) {
      // Note: assumes input param webhooks is input option param
      options = webhooks; // eslint-disable-line no-param-reassign
      webhooks = undefined; // eslint-disable-line no-param-reassign
    }

    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType(['undefined', 'object', 'string'], webhooks, 'Webhooks');

    // Sanitize input parameters and create function-wide variables
    const saniWebhooks = (webhooks !== undefined)
      ? sani.db(JSON.parse(JSON.stringify(webhooks)))
      : undefined;
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = organizationID === null ? sani.db(organizationID) : null;
    const projID = projectID === null ? sani.db(projectID) : null;
    const branID = branchID === null ? sani.db(branchID) : null;
    const searchQuery = { archived: false };

    // Validate the provided options
    const validatedOptions = utils.validateOptions(options, ['includeArchived',
      'populate', 'fields', 'limit', 'skip', 'lean', 'sort'], Webhook);

    // Ensure search options are valid
    if (options) {
      // Create array of valid search options
      const validSearchOptions = ['server', 'type', 'name', 'createdBy', 'lastModifiedBy', 'archived',
        'archivedBy'];

      // Loop through provided options, look for validSearchOptions
      Object.keys(options).forEach((o) => {
        // If the provided option is a valid search option
        if (validSearchOptions.includes(o) || o.startsWith('custom.')) {
          // Ensure the archived search option is a boolean
          if (o === 'archived' && typeof options[o] !== 'boolean') {
            throw new M.DataFormatError(`The option '${o}' is not a boolean.`, 'warn');
          }
          // Ensure the search option is a string
          else if (typeof options[o] !== 'string' && o !== 'archived') {
            throw new M.DataFormatError(`The option '${o}' is not a string.`, 'warn');
          }
          // Add the search option to the searchQuery
          searchQuery[o] = sani.db(options[o]);
        }
      });
    }

    let organization;
    let project;
    let branch;
    if (orgID) {
      // Find the organization and validate that it was found and not archived (unless specified)
      organization = await helper.findAndValidate(Org, orgID,
        ((options && options.archived) || validatedOptions.includeArchived));
    }
    if (projID) {
      // Find the project and validate that it was found and not archived (unless specified)
      project = await helper.findAndValidate(Project, utils.createID(orgID, projID),
        ((options && options.archived) || validatedOptions.includeArchived));
    }
    if (branID) {
      // Ensure the branch is not archived
      branch = await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID),
        ((options && options.archived) || validatedOptions.includeArchived));
    }

    // Permissions check
    permissions.readWebhook(reqUser, organization, project, branch);

    // Add the webhook level to the search query
    if (branID) {
      searchQuery.branch = utils.createID(orgID, projID, branID);
    }
    else if (projID) {
      searchQuery.project = utils.createID(orgID, projID);
    }
    else if (orgID) {
      searchQuery.org = orgID;
    }
    else {
      searchQuery.server = true;
    }

    // Add webhook ids to the search query
    if (saniWebhooks !== undefined) searchQuery._id = saniWebhooks;

    // If the includeArchived field is true, remove archived from the query; return everything
    if (validatedOptions.includeArchived) {
      delete searchQuery.archived;
    }
    // If the archived field is true, query only for archived elements
    if (validatedOptions.archived) {
      searchQuery.archived = true;
    }

    return Webhook.find(searchQuery, validatedOptions.fieldsString,
      { skip: validatedOptions.skip,
        limit: validatedOptions.limit,
        sort: validatedOptions.sort,
        populate: validatedOptions.populate,
        lean: validatedOptions.lean
      });
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

/**
 * @description This functions creates one or many webhooks. Before creating a webhook document,
 * it validates that the webhook data is formatted properly, ensures that the user has the proper
 * permissions, and upon creation returns the new document.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string|null} organizationID - The ID of the owning organization.
 * @param {string|null} projectID - The ID of the owning project.
 * @param {string|null} branchID - The ID of the owning branch.
 * @param {(object|object[])} webhooks - Either an array of objects containing
 * webhook data or a single object containing webhook data to create.
 * @param {string} [webhooks.name] - The name of the webhook.
 * @param {string} webhooks.type - The type of the webhook, which must be either 'Outgoing'
 * 'Incoming'.
 * @param {string} [webhooks.description] - An optional field to provide a description for
 * the webhook.
 * @param {object} [webhooks.triggers] - An array of strings referencing the events that trigger
 * outgoing webhooks and events that incoming webhooks will emit.
 * @param {object} webhooks.responses - An array of objects containing data used to send
 * http requests upon the webhook triggering. Each response must contain a url field, while the
 * method field defaults to 'POST' and the headers field defaults to
 * {'Content-Type': 'application/json'}. Each response may also contain a ca field for a
 * certificate authority, an auth object that contains a username and password, and a data field
 * that contains data to send with the request. Outgoing webhooks must have a responses field.
 * @param {object} [webhooks.incoming] - An object that contains a token string and a
 * tokenLocation string. The token is a key that external requests to trigger the webhook must
 * provide, and the tokenLocation is the expected url of the external request. Incoming webhooks
 * must have an incoming field.
 * @param {string} webhooks.level - The level at which the webhook listens for events. Can be either
 * an empty string to indicate server level or an org, project, or branch id.
 * @param {object} [webhooks.custom] - Any additional key/value pairs for an
 * object. Must be proper JSON form.
 * @param {object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return of the found
 * objects. By default, no fields are populated.
 * @param {string[]} [options.fields] - An array of fields to return. By default includes the _id,
 * id, and contains. To NOT include a field, provide a '-' in front.
 * @param {boolean} [options.lean = false] - A boolean value that if true returns raw JSON instead
 * of converting the data to objects.
 *
 * @returns {Promise<object[]>} Array of created webhook objects.
 *
 * @example
 * create({User}, 'orgID', 'projID', 'branch', [{Webhook1}, {Webhook2}, ...],
 * { populate: ['createdBy'] })
 * .then(function(webhooks) {
 *   // Do something with the newly created webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function create(requestingUser, organizationID, projectID, branchID, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType('object', webhooks, 'Webhooks');

    // Sanitize input parameters and create function-wide variables
    const saniWebhooks = sani.db(JSON.parse(JSON.stringify(webhooks)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = organizationID === null ? sani.db(organizationID) : null;
    const projID = projectID === null ? sani.db(projectID) : null;
    const branID = branchID === null ? sani.db(branchID) : null;
    let webhooksToCreate;

    // Initialize and ensure options are valid
    const validatedOptions = utils.validateOptions(options, ['populate', 'fields',
      'lean'], Webhook);

    // Check the type of the webhooks parameter; format it into an array if it's a single object
    if (Array.isArray(saniWebhooks)) {
      webhooksToCreate = saniWebhooks;
    }
    else if (typeof saniWebhooks === 'object') {
      webhooksToCreate = [saniWebhooks];
    }

    let organization;
    let project;
    let branch;
    if (orgID) {
      // Find the organization and validate that it was found and not archived (unless specified)
      organization = await helper.findAndValidate(Org, orgID,
        ((options && options.archived) || validatedOptions.includeArchived));
    }
    if (projID) {
      // Find the project and validate that it was found and not archived (unless specified)
      project = await helper.findAndValidate(Project, utils.createID(orgID, projID),
        ((options && options.archived) || validatedOptions.includeArchived));
    }
    if (branID) {
      // Ensure the branch is not archived
      branch = await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID),
        ((options && options.archived) || validatedOptions.includeArchived));
    }

    // Permissions check
    permissions.createWebhook(reqUser, organization, project, branch);

    // Set the fields of the webhook object
    const webhookObjects = webhooksToCreate.map((webhookObj) => {
      webhookObj._id = uuidv4();
      if (branID) {
        webhookObj.level.id = utils.createID(orgID, projID, branID);
      }
      else if (projID) {
        webhookObj.level.id = utils.createID(orgID, projID);
      }
      else if (orgID) {
        webhookObj.level.id = orgID;
      }
      else {
        webhookObj.level.id = 'server';
      }
      webhookObj.lastModifiedBy = reqUser._id;
      webhookObj.createdBy = reqUser._id;
      webhookObj.updatedOn = Date.now();
      webhookObj.archivedBy = webhookObj.archived ? reqUser._id : null;
      webhookObj.archivedOn = webhookObj.archived ? Date.now() : null;

      return webhookObj;
    });

    // Create the webhooks
    const createdWebhooks = await Webhook.insertMany(webhookObjects);

    // Find the newly created webhooks
    const createdIDs = createdWebhooks.map((w) => w._id);
    const foundWebhooks = await Webhook.find({ _id: createdIDs }, validatedOptions.fieldsString,
      { populate: validatedOptions.populateString,
        lean: validatedOptions.lean
      });

    // Emit the event for webhook creation
    EventEmitter.emit('webhooks-created', foundWebhooks);

    return foundWebhooks;
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

/**
 * @description This function updates one or many webhooks. It checks that the user has permissions
 * at the appropriate level and also that the user is not attempting to modify an immutable field.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string|null} organizationID - The ID of the owning organization.
 * @param {string|null} projectID - The ID of the owning project.
 * @param {string|null} branchID - The ID of the owning branch.
 * @param {object|object[]} webhooks - An array of objects containing updates to webhooks or
 * a single object containing an update to a single webhook.
 * @param {string} webhooks.id - The ID of the webhook being updated. Field
 * cannot be updated but is required to find webhook.
 * @param {string} [webhooks.name] - The updated name of the webhook.
 * @param {string} [webhooks.description] - The updated description of the webhook.
 * @param {string[]} [webhooks.triggers] - The updated list of triggers for the webhook.
 * @param {object[]} [webhooks.responses] - The updated list of response objects for an
 * outgoing webhook.
 * @param {object} [webhooks.incoming] - The updated field containing a token and token location
 * for an incoming webhook.
 * @param {object} [options] - A parameter that provides supported options.
 * @param {string[]} [options.populate] - A list of fields to populate on return
 * of the found objects. By default, no fields are populated.
 * @param {string[]} [options.fields] - An array of fields to return. By default
 * includes the _id, id, and contains. To NOT include a field, provide a '-' in
 * front.
 *
 * @returns {Promise<object[]>} Array of updated webhook objects.
 *
 * @example
 * update({User}, 'orgID', 'projID', 'branch', [{Webhook1}, {Webhook2}...], { populate: 'parent' })
 * .then(function(webhooks) {
 *   // Do something with the newly updated webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function update(requestingUser, organizationID, projectID, branchID, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType('object', webhooks, 'Webhooks');
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

/**
 * @description This function removes one or many webhooks. Once the webhooks are deleted, the
 * documents as they were before deletion are returned.
 *
 * @param {User} requestingUser - The object containing the requesting user.
 * @param {string|null} organizationID - The ID of the owning organization.
 * @param {string|null} projectID - The ID of the owning project.
 * @param {string|null} branchID - The ID of the owning branch.
 * @param {(string|string[])} webhooks - The webhooks to remove. Can either be
 * an array of webhook ids or a single webhook id.
 * @param {object} [options] - A parameter that provides supported options.
 * Currently there are no supported options.
 *
 * @returns {Promise<object[]>} Array of deleted element ids.
 *
 * @example
 * remove({User}, 'orgID', 'projID', 'branchID', ['webhook1', 'webhook2'])
 * .then(function(webhooks) {
 *   // Do something with the deleted webhooks
 * })
 * .catch(function(error) {
 *   M.log.error(error);
 * });
 */
async function remove(requestingUser, organizationID, projectID, branchID, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType(['object', 'string'], webhooks, 'Webhooks');

    // Sanitize input parameters and create function-wide variables
    const saniWebhooks = sani.db(JSON.parse(JSON.stringify(webhooks)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    const orgID = organizationID === null ? sani.db(organizationID) : null;
    const projID = projectID === null ? sani.db(projectID) : null;
    const branID = branchID === null ? sani.db(branchID) : null;
    let webhooksToFind = [];

    // Check the type of the webhooks parameter
    if (Array.isArray(saniWebhooks) && saniWebhooks.length !== 0) {
      webhooksToFind = saniWebhooks;
    }
    else if (typeof saniWebhooks === 'string') {
      webhooksToFind = [saniWebhooks];
    }

    let organization;
    let project;
    let branch;
    if (orgID) {
      // Find the organization and validate that it was found and not archived
      organization = await helper.findAndValidate(Org, orgID);
    }
    if (projID) {
      // Find the project and validate that it was found and not archived
      project = await helper.findAndValidate(Project, utils.createID(orgID, projID));
    }
    if (branID) {
      // Ensure the branch is not archived
      branch = await helper.findAndValidate(Branch, utils.createID(orgID, projID, branID));
    }

    // Note: This assumes that all webhooks passed in are on the same org/project/branch
    // Permissions check
    permissions.deleteWebhook(reqUser, organization, project, branch);

    // Find webhooks to delete
    const foundWebhooks = await Webhook.find({ _id: { $in: webhooksToFind } },
      null, { lean: true });
    const foundWebhookIDs = foundWebhooks.map((w) => w._id);

    // Check that all webhooks were found
    const notFoundIDs = webhooksToFind.filter((w) => !foundWebhookIDs.includes(w));
    // If not all were found, throw an error
    if (notFoundIDs.length > 0) {
      throw new M.NotFoundError('The following webhooks were not found: '
        + `[${notFoundIDs}].`, 'warn');
    }

    // Delete the webhooks
    await Webhook.deleteMany(webhooks);

    // Emit event for webhook deletion
    EventEmitter.emit('webhooks-deleted', foundWebhooks);

    return foundWebhooks;
  }
  catch (error) {
    throw errors.captureError(error);
  }
}
