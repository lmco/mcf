/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.api-client.ArtifactService
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Defines the artifact service.
 */

// MBEE modules
import ApiClient from './ApiClient.js';

class ArtifactService extends ApiClient {

  constructor(authContext) {
    super(authContext, '/api/orgs');
  }

  get(orgID, projID, branchID, options) {
    const url = `${this.url}/${orgID}/projects/${projID}/branches/${branchID}/artifacts`;
    return super.get(options, url);
  }

  post(orgID, projID, branchID, data, options) {
    const url = `${this.url}/${orgID}/projects/${projID}/branches/${branchID}/artifacts`;
    return super.post(data, options, url);
  }

  patch(orgID, projID, branchID, data, options) {
    const url = `${this.url}/${orgID}/projects/${projID}/branches/${branchID}/artifacts`;
    return super.patch(data, options, url);
  }

  put(orgID, projID, branchID, data, options) {
    const url = `${this.url}/${orgID}/projects/${projID}/branches/${branchID}/artifacts`;
    return super.put(data, options, url);
  }

  delete(orgID, projID, branchID, data, options) {
    const url = `${this.url}/${orgID}/projects/${projID}/branches/${branchID}/artifacts`;
    return super.delete(data, options, url);
  }

}

export default ArtifactService;
