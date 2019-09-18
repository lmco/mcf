// ESLint disbled for client-side JS for now.
// TODO (jk) - determine long-term approach
/* eslint-disabled */

$.fn.extend({
  autoResize: function() {
    const nlines = $(this).html().split('\n').length;
    $(this).attr('rows', nlines + 1);
  }
});


/**
 * Determines the identity of the current user. If the user is stored in session
 * storage, that is used. Otherwise, an API call is made to /api/users/whoami
 * to get the user information and store it in session storage.
 *
 * Takes a callback as input that will passed an error, and the user data.
 */
// eslint-disable-next-line no-unused-vars
function mbeeWhoAmI(callback) {
  // If user is already stored, use that.
  if (window.sessionStorage.hasOwnProperty('mbee-user')
    && window.sessionStorage['mbee-user'] !== null) {
    return callback(null, JSON.parse(window.sessionStorage['mbee-user']));
  }

  // If not found, do ajax call
  const url = '/api/users/whoami?minified=true';
  $.ajax({
    method: 'GET',
    url: url,
    statusCode: {
      401: () => {
        const path = window.location.pathname;
        if (!path.startsWith('/doc') && !path.startsWith('/login')
          && !path.startsWith('/about')) {
          // Refresh when session expires
          window.location.reload();
        }
      }
    },
    success: (_data) => {
      const data = {
        username: _data.username,
        fname: _data.fname,
        lname: _data.lname,
        preferredName: _data.preferredName,
        email: _data.email,
        custom: _data.custom,
        admin: _data.admin,
        provider: _data.provider
      };
      if (data.username) {
        window.sessionStorage.setItem('mbee-user', JSON.stringify(data));
      }
      callback(null, data);
    },
    error: (err) => {
      callback(err, null);
    }
  });
}

/**
 * @description Given an API parameter string, converts to Proper Case. Conversely, given a Proper
 *              Case string will convert to an API parameter string.
 * e.g. createdBy -> Created By, lastModifiedBy -> Last Modified By
 *
 * @param {string} param - API parameter string.
 * @param {string} caseType - Case to convert to. e.g 'Proper Case' vs 'API Parameter Format'
 *
 * @return {string} - Converted case string.
 */
// eslint-disable-next-line no-unused-vars
function convertCase(param, caseType) {
  // Check if param is not a string
  if (typeof param !== 'string' || typeof caseType !== 'string') {
    // Cannot convert case, return param
    return param;
  }

  let convertedCase = '';

  if (caseType === 'proper') {
    // Convert API params to option values
    convertedCase = param.split(/(?=[A-Z])/).join(' ');
    convertedCase = convertedCase.charAt(0).toUpperCase() + convertedCase.slice(1);
  }
  else if (caseType === 'api') {
    // Remove spaces fom string
    convertedCase = param.split(' ').join('');
    // Convert first character to lower case
    convertedCase = convertedCase.charAt(0).toLowerCase() + convertedCase.slice(1);
  }

  return convertedCase;
}

/**
 * @description Decodes an HTML encoded string.
 *
 * @param {string} encodedString - HTML encoded string.
 *
 * @return {string} - decoded string.
 */
// eslint-disable-next-line no-unused-vars
function decodeHTML(encodedString) {
  // Check if input is string type
  if (typeof encodedString === 'string') {
    // Replace HTML escape sequences with corresponding characters
    return String(encodedString)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  }
}
