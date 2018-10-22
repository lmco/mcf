/**
 * Classification: UNCLASSIFIED
 *
 * @module models.artifacts
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
 * @description Middleware plugin that extends models.
 * Allows for artifacts to be stored. Artifacts are arbitrary data and
 * include: PDFs, images, zip files, other archives.
 */

// NPM modules
const mongoose = require('mongoose');

// MBEE modules
const utils = M.require('lib.utils');
const validators = M.require('lib.validators');
const timestamp = M.require('models.plugin.timestamp');

const ArtifactSchema = new mongoose.Schema({
  id:{
    type: String,
    required: true,
    index: true
  },
  hash: {
    type: String,
    required: true
  },
  filename : {
    type: String,
    required: true,
  },
  data: Buffer, //TODO: remove later
  location: {
    type: String,
    require: true
  },
  contentType: {
    type: String,
    require: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
});

/* ---------------------------( Model Plugin )---------------------------- */
// Use timestamp model plugin
ArtifactSchema.plugin(timestamp);

/* ---------------------------( User Middleware )---------------------------- */


/* -----------------------------( User Methods )----------------------------- */


/* ---------------------------( User Properties )---------------------------- */

/* -------------------------( User Schema Export )--------------------------- */
// Export mongoose model as 'Artifact'
module.exports = mongoose.model('Artifact', ArtifactSchema);
