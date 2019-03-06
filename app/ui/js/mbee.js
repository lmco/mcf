// ESLint disbled for client-side JS for now.
// TODO (jk) - determine long-term approach
/* eslint-disable */

$.fn.extend({
  autoResize: function() {
    const nlines = $(this).html().split('\n').length;
    $(this).attr('rows', nlines + 1);
  }
});


