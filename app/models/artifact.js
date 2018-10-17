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
const ArtifactSchema = new mongoose.Schema({
  id: id,
  data: Buffer,
  contentType: String,
  ref: 'User',




});

/* ---------------------------( Model Plugin )---------------------------- */
// Use timestamp model plugin
UserSchema.plugin(timestamp);

/* ---------------------------( User Middleware )---------------------------- */


/* -----------------------------( User Methods )----------------------------- */


/* ---------------------------( User Properties )---------------------------- */

/* -------------------------( User Schema Export )--------------------------- */
// Export mongoose model as 'Artifact'
module.exports = mongoose.model('Artifact', ArtifactSchema);
