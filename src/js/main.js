var cm = CodeMirror(document.querySelector('section.code-container'), {
  mode: 'javascript',
  lineNumbers: true,
  gutters: ["CodeMirror-lint-markers"],
  lint: true
});

var output = document.getElementById('output-frame');

var editorWidgets = [];

/*jshintWorker.onmessage = function(event) {
  if (event.data.type == 'jshint') {
    editorWidgets.forEach(function(widget) {
      cm.removeWidget(widget);
    });
    editorWidgets = [];
    event.data.message.hintErrors.forEach(function(error) {
      if (error) {
        var message = document.createElement('div');
        var icon = message.appendChild(document.createElement('span'));
        icon.innerHTML = '!!';
        icon.className = 'lint-error-icon';
        message.appendChild(document.createTextNode(error.reason));
        message.className = 'lint-error';

        editorWidgets.push(cm.addLineWidget(error.line - 1, message, {coverGutter: false, noHScroll: true}));
      }
    });
  }
};*/

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
