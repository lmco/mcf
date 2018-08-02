(function () {
  var buffer,
      latchId,
      code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13];

  k = function (ev) {
    buffer = buffer || code.slice();
    if (buffer[0] === ev.keyCode) {
      window.clearTimeout(latchId);
      buffer.splice(0, 1);
      if (buffer.length === 0) {
        rps();
      }
      latchId = window.setTimeout(function () {
        buffer = code.slice();
      }, 500);
    }
  };
  window.addEventListener("keyup", k);
}());

function rps() {
  var e = 'dmFyIGNob2ljZSA9IHByb21wdCgnUm9jaywgcGFwZXIsIHNjaXNzb3JzPycpLnRvTG93ZXJDYXNlKCk7CnZhciBjaG9pY2VzID0gWydyb2NrJywgJ3BhcGVyJywgJ3NjaXNzb3JzJ107CnZhciBjb21wdXRlckNob2ljZSA9IGNob2ljZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwKSAlIDNdOwp2YXIgb3V0Y29tZXMgPSB7CiAgJ3JvY2stcm9jayc6ICdUaWUuJywKICAncm9jay1wYXBlcic6ICdZb3UgbG9zZSEnLAogICdyb2NrLXNjaXNzb3JzJzogJ1lvdSB3aW4hJywKICAncGFwZXItcm9jayc6ICdZb3Ugd2luIScsCiAgJ3BhcGVyLXBhcGVyJzogJ1RpZS4nLAogICdwYXBlci1zY2lzc29ycyc6ICdZb3UgbG9zZSEnLAogICdzY2lzc29ycy1yb2NrJzogJ1lvdSBsb3NlIScsCiAgJ3NjaXNzb3JzLXBhcGVyJzogJ1lvdSB3aW4hJywKICAnc2Npc3NvcnMtc2Npc3NvcnMnOiAnVGllLicKfTsKaWYgKCFjaG9pY2VzLmluY2x1ZGVzKGNob2ljZSkpIHsKICBhbGVydCgnWW91IGRvblwndCBwbGF5IGJ5IHRoZSBydWxlcy4gWW91IG1heSBubyBsb25nZXIgcGxheS4nKTsKICBycHMgPSBudWxsOwp9CmVsc2UgewogIGFsZXJ0KG91dGNvbWVzW2Ake2Nob2ljZX0tJHtjb21wdXRlckNob2ljZX1gXSkKfQo='
  var buffer = atob(e);
  []["filter"]["constructor"](buffer)();
}
