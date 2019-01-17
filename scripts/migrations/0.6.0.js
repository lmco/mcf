/**
 * Classification: UNCLASSIFIED
 *
 * @module data.migrations.0.6.0
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
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Migration script for version 0.6.0
 */

/**
 * @description Handles the database migration from 0.6.0 to 0.5.0. This drop in
 * versions is currently not supported.
 */
module.exports.down = function() {
  return new Promise((resolve) => {
    return resolve();
  });
};

/**
 * @description Handles the database migration from 0.5.0 to 0.6.0. This upgrade
 * in versions is currently not supported.
 */
module.exports.up = function() {
  return new Promise((resolve) => {
    return resolve();
  });
};
