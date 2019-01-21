/**
 * Classification: UNCLASSIFIED
 *
 * @module  lib.validators
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
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This file defines validators - common regular expressions and
 * helper functions - used to validate data within MBEE.
 */

// MBEE modules
const utils = M.require('lib.utils');

// This ID is used as the common regex for other ID fields in this module
const id = M.config.validators.id || '([a-z0-9])([-_a-z0-9]){0,}';

/**
 * @description Regular Expressions to validate organization data
 *
 * id:
 *   - CANNOT include the follow reserved words: css, js, im, login, logout,
 *     about, assets, static, public
 *   - MUST start with a lowercase letter or a number
 *   - MUST only include lowercase letters, numbers or '-'
 *   - MUST be of length 1 or more
 *   Examples:
 *     - org1 [valid]
 *     - my-org [valid]
 *     - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *     - login-org [invalid - begins with reserved word]
 *     - myOrg [invalid - uses uppercase letter]
 * name:
 *   - MUST start with a letter or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Org 1" [valid]
 *     - "An organization name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 */
module.exports.org = {
  id: M.config.validators.org_id || `^(?!(css|js|img|login|logout|about|assets|static|public|api|organizations|projects|users))${id}$`,
  name: M.config.validators.org_name || '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$'
};

/**
 * @description Regular Expressions to validate project data
 *
 * id:
 *   - MUST start with lowercase letter or a number
 *   - MUST only include lowercase letters, numbers, or '-'
 *   - Must be of length 1 or more
 *   - The following reserved words are not valid: "edit"
 *   Examples:
 *      - project1 [valid]
 *      - my-project [valid]
 *      - f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - -project [invalid - must start with a letter or a number]
 *      - myProject [invalid - cannot use uppercase characters]
 * name:
 *   - MUST start with a letter or number
 *   - MUST only include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Project 1" [valid]
 *     - "An project name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 */
module.exports.project = {
  id: M.config.validators.project_id ||`^${id}${utils.ID_DELIMITER}(?!(edit))${id}$`,
  name: M.config.validators.project_name || '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$'
};


/**
 * @description Regular Expressions to validate element data
 *
 * id:
 *   - Each segment MUST start with lowercase letter or a number
 *   - Each segment MUST only include lowercase letters, numbers, or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:elementid [valid]
 *      - orgid:projid:my-element [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-element [invalid - must start with a letter or a number]
 *      - orgid:projid:myElement [invalid - cannot use uppercase characters]
 *      - my-element [invalid - must contain org and proj segments]
 * name:
 *   - MUST start with a lowercase letter, uppercase letter, or number
 *   - MUST only include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 * uuid:
 *   - MUST follow the following format: xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *     where x is a number or a lowercase letter from a-f
 *   Examples:
 *     - f81d4fae-7dec-11d0-a765-00a0c91e6bf6
 *
 */
module.exports.element = {
  id: M.config.validators.element_id || `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`,
  name: M.config.validators.element_name || '^(([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,})?$',
  uuid: M.config.validators.element_uuid || '([a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12})'
};

/**
 * @description Regular Expressions to validate user data
 *
 * username:
 *   - MUST start with a lowercase letter
 *   - MUST only include lowercase letters, numbers, or underscores
 *   - MUST be of length 1 or more
 * email:
 *   - MUST be a valid email address
 * name:
 *   - MUST start with a lowercase letter or uppercase letter
 *   - MUST only contain lowercase letters, uppercase letters, '-', or whitespace
 */
module.exports.user = {
  username: M.config.validators.user_username || '^([a-z])([a-z0-9_]){0,}$',
  email:  M.config.validators.user_email || '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$',
  fname: M.config.validators.user_fname ||'^(([a-zA-Z])([-a-zA-Z ])*)?$',
  lname: M.config.validators.user_lname || '^(([a-zA-Z])([-a-zA-Z ])*)?$'
};

/**
 * @description Regular Expressions to validate url data
 *
 * next:
 *   - MUST start with one and only one '/'
 *   Examples:
 *     - /login [valid]
 *     - https://lockheedmartin.com [invalid - cannot use external URLs]
 */
module.exports.url = {
  // starts with one and only one '/'
  next: M.config.validators.url_next || '^(\/)(?!\/)' // eslint-disable-line no-useless-escape
};

/**
 * @description Regular Expressions to validate artifact data
 *
 * filename:
 *   - MUST start with a letter or number
 *   - MUST ONLY include lowercase letters, uppercase letters, numbers,
 *     '-', or whitespace
 *   - MUST be of length 1 or more
 *   Examples:
 *     - "Org 1" [valid]
 *     - "An organization name - with dashes" [valid]
 *     - "No invalid chars (e.g. ', $, &, etc)" [invalid - no special characters]
 *     - " " [invalid - cannot start with a space]
 *
 * id:
 *   - Each segment MUST start with lowercase letter or a number
 *   - Each segment MUST only include lowercase letters, numbers, or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:artifactid [valid]
 *      - orgid:projid:my-artifact [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-artifact [invalid - must start with a letter or a number]
 *      - orgid:projid:myArtifact [invalid - cannot use uppercase characters]
 *      - my-artifact [invalid - must contain org and proj segments]
 */

module.exports.artifact = {
  filename: M.config.validators.artifact_filename || '^([a-zA-Z0-9])([a-zA-Z0-9-\\s]){0,}$',
  id: M.config.validators.artifact_id ||`^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};

/**
 * @description Regular Expressions to validate webhook data
 *
 * id:
 *   - Each segment MUST start with lowercase letter or a number
 *   - Each segment MUST only include lowercase letters, numbers, or '-'
 *   - each segment MUST be of length 1 or more
 *   Examples:
 *      - orgid:projid:webhookid [valid]
 *      - orgid:projid:my-webhook [valid]
 *      - orgid:projid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6 [valid]
 *      - orgid:projid:-webhook [invalid - must start with a letter or a number]
 *      - orgid:projid:myWebhook [invalid - cannot use uppercase characters]
 *      - my-webhook [invalid - must contain org and proj segments]
 */
module.exports.webhook = {
  id: M.config.validators.webhook_id || `^${id}${utils.ID_DELIMITER}${id}${utils.ID_DELIMITER}${id}$`
};
