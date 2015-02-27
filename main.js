var cm = CodeMirror(document.querySelector('section.code-container'), {
  mode: 'javascript',
  lineNumbers: true
});

var output = document.getElementById('output-frame');
var jshintWorker = new Worker('jshint-worker.js');

jshintWorker.onmessage = function(event) {
  if (event.data.type == 'jshint') {
    console.log(event.data);
  }
};

var timeoutId = null;
cm.on('changes', function() {
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  timeoutId = setTimeout(executeCode, 500);
});

function executeCode(code) {
  var code = cm.getValue();
  jshintWorker.postMessage({code: code});
  timeoutId = null;
  output.contentWindow.postMessage(cm.getValue(), '*');
}

/*cm.addKeyMap({
  "Tab": function (cm) {
    if (cm.somethingSelected()) {
      var sel = editor.getSelection("\n");
      // Indent only if there are multiple lines selected, or if the selection spans a full line
      if (sel.length > 0 && (sel.indexOf("\n") > -1 || sel.length === cm.getLine(cm.getCursor().line).length)) {
        cm.indentSelection("add");
        return;
      }
    }

    if (cm.options.indentWithTabs) {
      cm.execCommand("insertTab");
    } else {
      cm.execCommand("insertSoftTab");
    }
  },
  "Shift-Tab": function (cm) {
    cm.indentSelection("subtract");
  }
})*/
