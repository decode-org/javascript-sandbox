var Sandbox = function(container, output) {
  var self = this;
  this.container = container;
  this.output = output;
  this.timeoutId = null;
  this.proxyCode = Sandbox.prototype.executeCode.bind(self);

  this.cm = CodeMirror(this.container, {
    mode: 'javascript',
    lineNumbers: true,
    gutters: ["CodeMirror-lint-markers"],
    lint: true
  });

  this.cm.on('changes', function() {
    if (self.timeoutId != null) {
      clearTimeout(self.timeoutId);
      self.timeoutId = null;
    }
    self.timeoutId = setTimeout(self.proxyCode, 500);
  });
};

Sandbox.prototype.executeCode = function() {
  var code = this.cm.getValue();
  this.timeoutId = null;
  this.output.contentWindow.postMessage(this.cm.getValue(), '*');
};

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
