$.fn.extend({
  autoResize: function() {
    const nlines = $(this).html().split('\n').length;
    $(this).attr('rows', nlines + 1);
  }
});


