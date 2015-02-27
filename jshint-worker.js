// Some code taken from Khan Academy
// https://github.com/Khan/live-editor/blob/master/js/workers/pjs/jshint-worker.js
var first = true, self = this;
this.onmessage = function(event) {
  if (first) {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/jshint/2.6.0/jshint.js');
    first = false;
  }

  JSHINT(event.data.code);

  postMessage({
    type: 'jshint',
    message: {
      hintData: JSON.parse(JSON.stringify(JSHINT.data())),
      hintErrors: JSON.parse(JSON.stringify(JSHINT.errors))
    }
  });
}
