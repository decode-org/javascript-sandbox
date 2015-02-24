var cm = CodeMirror(document.querySelector('section.code-container'), {
  mode: 'javascript',
  lineNumbers: true
});

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
