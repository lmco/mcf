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

// Node modules


// MBEE modules
const Webhook = M.require('models.webhook');
const utils = M.require('lib.utils');
const errors = M.require('lib.errors');
const helper = M.require('lib.controller-utils');
const sani = M.require('lib.sanitization');


async function find(requestingUser, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType('object', webhooks, 'Webhooks');


    return Webhook.find({ _id: webhooks.id });
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

async function create(requestingUser, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType('object', webhooks, 'Webhooks');

    // Sanitize input parameters and create function-wide variables
    const saniWebhooks = sani.db(JSON.parse(JSON.stringify(webhooks)));
    const reqUser = JSON.parse(JSON.stringify(requestingUser));
    let webhooksToCreate;
    const duplicateCheck = {};

    // Initialize and ensure options are valid
    const validatedOptions = utils.validateOptions(options, [], Webhook);
    // TODO: use the options


    // Check the type of the webhooks parameter; format it into an array if it's a single object
    if (Array.isArray(saniWebhooks)) {
      webhooksToCreate = saniWebhooks;
    }
    else if (typeof saniWebhooks === 'object') {
      webhooksToCreate = [saniWebhooks];
    }


    // TODO: batch logic
    // assume there are no duplicates because I'm just prototyping
    const hook = webhooksToCreate[0];

    // initialize the base of the _id for the webhook
    let webhookLocation = 'server';
    if (hook.org) webhookLocation = hook.org;
    if (hook.project) webhookLocation = hook.project;
    if (hook.branch) webhookLocation = hook.branch;

    hook._id = utils.createID('webhook', webhookLocation, hook.id);
    delete hook.id;


    const webhook = Webhook.createDocument(hook);


    await Webhook.insertMany(webhook);

    // TODO: have logic in here to register the webhook after successful insertion into the database


    // TODO: find the webhooks after inserting them and return the found webhooks

    return { message: 'great success' };
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

async function update(requestingUser, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType('object', webhooks, 'Webhooks');

    //TODO: have logic in here to re-register the webhook

  }
  catch (error) {
    throw errors.captureError(error);
  }
}

async function remove(requestingUser, webhooks, options) {
  try {
    // Ensure input parameters are correct type
    helper.checkParams(requestingUser, options);
    helper.checkParamsDataType('object', webhooks, 'Webhooks');


    // TODO: find out if it's possible to unregister a listener without restarting the server


    await Webhook.deleteMany(webhooks);
    return 'success';
  }
  catch (error) {
    throw errors.captureError(error);
  }
}
