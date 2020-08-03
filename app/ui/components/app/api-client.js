/**
 * @classification UNCLASSIFIED
 *
 * @module ui.components.app.api-client
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Exports functions that simplify interfacing with the backend.
 */


async function login(form, setError, setAuthenticated) {
  // Create options for fetch request
  const options = {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(form)
  };

  // Make request to sign in
  const response = await window.fetch('/api/login', options);
  // Set error if bad response
  if (response.status >= 300) {
    const message = await response.text();
    setError(message);
  }
  // Set authenticated status if good response
  else {
    const data = await response.json();
    if (data.token) setAuthenticated(true);
  }
}

function userRequest(options, setError, data) {
  let base = '/api/users';
  if (options.username) base = `/api/users/${options.username}/password`;
  else if (options.whoami) base = '/api/users/whoami';
  return makeRequest(base, options, setError, data);
}

function orgRequest(options, setError, data) {
  const base = '/api/orgs';
  return makeRequest(base, options, setError, data);
}

function projectRequest(options, setError, data) {
  if (!options.orgid) throw new Error('Organization ID not defined as parameter for project request');
  const base = `/api/orgs/${options.orgid}/projects`;
  return makeRequest(base, options, setError, data);
}

function branchRequest(options, setError, data) {
  if (!options.orgid) throw new Error('Organization ID not defined as parameter for branch request');
  if (!options.projectid) throw new Error('Project ID not defined as parameter for branch request');
  const base = `/api/orgs/${options.orgid}/projects/${options.projectid}/branches`;
  return makeRequest(base, options, setError, data);
}

function elementRequest(options, setError, data) {
  if (!options.orgid) throw new Error('Organization ID not defined as parameter for element request');
  if (!options.projectid) throw new Error('Project ID not defined as parameter for element request');
  if (!options.branchid) throw new Error('Branch ID not defined as parameter for element request');
  const base = `/api/orgs/${options.orgid}/projects/${options.projectid}/branches/${options.branchid}`;
  return makeRequest(base, options, setError, data);
}

function artifactRequest(options, setError, data) {
  if (!options.orgid) throw new Error('Organization ID not defined as parameter for artifact request');
  if (!options.projectid) throw new Error('Project ID not defined as parameter for artifact request');
  let base = `/api/orgs/${options.orgid}/projects/${options.projectid}`;
  if (!options.blob) {
    if (!options.branchid) throw new Error('Branch ID not defined as parameter for artifact request');
    base = `${base}/branches/${options.branchid}`;
  }
  return makeRequest(base, options, setError, data);
}

function webhookRequest(options, setError, data) {
  let base = '/api/webhooks';
  // TODO: handle triggering webhooks
}

async function makeRequest(base, options, setError, data) {
  // Initialize options for the request
  validateMethod(options);
  const url = buildUrl(base, options);
  const fetchOpts = {
    method: options.method,
    headers: new Headers({ 'Content-Type': 'application/json' })
  };
  if (data) fetchOpts.body = JSON.stringify(data);

  // Make the request
  const response = await fetch(url, fetchOpts);

  // Check for errors in response status code
  const error = await checkError(response);
  if (error) {
    setError(error);
    return null;
  }
  // Return the data
  else {
    return response.json();
  }
}

function validateMethod(options) {
  const methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
  if (!options.method || !methods.includes(options.method)) {
    throw new Error('Fetch request made with invalid method');
  }
}

function buildUrl(base, options) {
  let opts = '';
  Object.keys(options).forEach((opt) => {
    // Ignore the following options
    if (opt === 'orgid'
      || opt === 'projectid'
      || opt === 'branchid'
      || opt === 'elementid'
      || opt === 'artifactid'
      || opt === 'webhookid'
      || opt === 'method'
      || opt === 'whoami') return;
    // Add the option to the query
    opts += `${opt}=${options[opt]}&`;
  });

  if (opts.length === 0) {
    // No options; return original url
    return base;
  }
  else {
    // Get rid of the trailing '&'
    opts = opts.slice(0, -1);
    // Return the url with options
    return `${base}?${opts}`;
  }
}

function checkError(response) {
  if (response.status >= 200 && response.status < 300) {
    return;
  }
  else if (response.status === 401) {
    // break the auth state
    window.sessionStorage.removeItem('mbee-user');
    // TODO: set authentication state to false in the auth provider
  }
  return response.text();
}


export {
  login,
  userRequest,
  orgRequest,
  projectRequest,
  branchRequest,
  elementRequest,
  artifactRequest,
  webhookRequest
};
