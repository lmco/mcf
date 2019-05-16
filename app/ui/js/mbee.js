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
 *
 * TODO - Is there a default option for the ajax statusCode for handling an
 * unexpected return status?
 */
function mbeeWhoami(callback) {
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
    success: (data) => {
      if (data.hasOwnProperty('username')) {
        window.sessionStorage.setItem('mbee-user', JSON.stringify(data));
      }
      callback(null, data);
    },
    error: (err) => {
      callback(err, null);
    }
  });
}


