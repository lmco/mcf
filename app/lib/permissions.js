/**
 * Classification: UNCLASSIFIED
 *
 * @module lib.permissions
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Provides permission lookup capabilities for MBEE actions.
 */


/**
 * Returns true if the user has permission to create an organization,
 * false otherwise.
 */
module.exports.orgCreate = function(user) {

};

/**
 * Returns true if the user has permission to read the organization,
 * false otherwise.
 */
module.exports.orgRead = function(user, org) {

};


/**
 * Returns true if the user has permission to update organization object,
 * false otherwise.
 */
module.exports.orgUpdate = function(user, org) {

};


/**
 * Returns true if the user has permission to delete the organization object,
 * false otherwise.
 */
module.exports.orgDelete = function(user, org) {

};


/**
 * Returns true if the user has permission to create a project within the org,
 * false otherwise.
 */
module.exports.projectCreate = function(user, org) {

};

/**
 * Returns true if the user has permission to read the project,
 * false otherwise.
 */
module.exports.projectRead = function(user, org, project) {

};


/**
 * Returns true if the user has permission to update project object,
 * false otherwise.
 */
module.exports.projectUpdate = function(user, org, project) {

};


/**
 * Returns true if the user has permission to delete the project object,
 * false otherwise.
 */
module.exports.projectDelete = function(user, org, project) {

};


/**
 * Returns true if the user has permission to create elements in the project,
 * false otherwise.
 */
module.exports.elementCreate = function(user, org) {

};

/**
 * Returns true if the user has permission to read elements in the project,
 * false otherwise.
 */
module.exports.elementRead = function(user, org, project) {

};


/**
 * Returns true if the user has permission to update project element objects,
 * false otherwise.
 */
module.exports.elementUpdate = function(user, org, project) {

};


/**
 * Returns true if the user has permission to delete the project elements,
 * false otherwise.
 */
module.exports.elementDelete = function(user, org, project) {

};
