/**
 * Classification: UNCLASSIFIED
 *
 * @module models.plugin.userPlugin
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
 * @author Phillip Lee <phillip.lee@lmco.com>
 *
 * @description Plugin that extends from the user models.
 */

module.exports = function userModelPlugin (schema, options) {
  schema.add({ createdOn: Date });

  schema.pre('save', function (next) {
    // Set a value for createdOn only if it is null
    if (!this.createdAt) {
      this.createdOn = Date.now;
    }
    next();
  });

  if (options && options.index) {
    schema.path('createdOn').index(options.index);
  }
}
