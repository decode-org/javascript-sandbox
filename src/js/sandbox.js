var Sandbox = function (container, output) {
  var self = this;
  this.container = container;
  this.output = output;
  this.timeoutId = null;
  this.proxyCode = Sandbox.prototype.executeCode.bind(self);

  this.cm = CodeMirror(this.container, {
    mode: 'javascript',
    lineNumbers: true,
    gutters: ["CodeMirror-lint-markers"],
    lint: true,
    indentWithTabs: false,
    indentUnit: 4
  });

  this._addKeyMap();

  this.cm.on('changes', function () {
    if (self.timeoutId != null) {
      clearTimeout(self.timeoutId);
      self.timeoutId = null;
    }
    self.timeoutId = setTimeout(self.proxyCode, 500);
  });
};

Sandbox.prototype.executeCode = function () {
  var code = this.cm.getValue();
  this.timeoutId = null;
  this.output.contentWindow.postMessage(this.cm.getValue(), '*');
};

// Attempts to handle soft tabs
// Modified from Brackets' implementation
// https://github.com/adobe/brackets/blob/176b0e4b94bd8d1ab0f155f2d1d6607fbb961bf8/src/editor/Editor.js

Sandbox.prototype._addKeyMap = function () {
  var self = this;
  this.cm.addKeyMap({
    "Tab": function () {
      self._handleTabKey();
    },
    "Shift-Tab": "indentLess",

    "Left": function (instance) {
      self._handleTabNavigation(-1, "moveH");
    },
    "Right": function (instance) {
      self._handleTabNavigation(1, "moveH");
    },
    "Backspace": function (instance) {
      self._handleTabNavigation(-1, "deleteH");
    },
    "Delete": function (instance) {
      self._handleTabNavigation(1, "deleteH");
    },
    "Esc": function (instance) {
      CodeMirror.commands.singleSelection(instance);
    },
    "Home": "goLineLeftSmart",
    "Cmd-Left": "goLineLeftSmart",
    "End": "goLineRight",
    "Cmd-Right": "goLineRight"
  });
};

Sandbox.prototype._handleTabNavigation = function (direction, functionName) {
  var instance = this.cm;
  var overallJump = null;

  var indentUnit = instance.getOption("indentUnit");

  instance.listSelections().forEach(function (sel) {
    if (CodeMirror.cmpPos(sel.anchor, sel.head) !== 0) {
      // This is a range - it will just collapse/be deleted regardless of the jump we set, so
      // we can just ignore it and continue. (We don't want to return false in this case since
      // we want to keep looking at other ranges.)
      return;
    }

    var cursor = sel.anchor,
      jump = (indentUnit === 0) ? 1 : cursor.ch % indentUnit,
      line = instance.getLine(cursor.line);

    // Don't do any soft tab handling if there are non-whitespace characters before the cursor in
    // any of the selections.
    if (line.substr(0, cursor.ch).search(/\S/) !== -1) {
      jump = null;
    } else if (direction === 1) { // right
      if (indentUnit) {
        jump = indentUnit - jump;
      }

      // Don't jump if it would take us past the end of the line, or if there are
      // non-whitespace characters within the jump distance.
      if (cursor.ch + jump > line.length || line.substr(cursor.ch, jump).search(/\S/) !== -1) {
        jump = null;
      }
    } else { // left
      // If we are on the tab boundary, jump by the full amount,
      // but not beyond the start of the line.
      if (jump === 0) {
        jump = indentUnit;
      }
      if (cursor.ch - jump < 0) {
        jump = null;
      } else {
        // We're moving left, so negate the jump.
        jump = -jump;
      }
    }

    // Did we calculate a jump, and is this jump value either the first one or
    // consistent with all the other jumps? If so, we're good. Otherwise, bail
    // out of the foreach, since as soon as we hit an inconsistent jump we don't
    // have to look any further.
    if (jump !== null &&
      (overallJump === null || overallJump === jump)) {
      overallJump = jump;
    } else {
      overallJump = null;
      return false;
    }
  });

  if (overallJump === null) {
    // Just do the default move, which is one char in the given direction.
    overallJump = direction;
  }
  instance[functionName](overallJump, "char");
};

Sandbox.prototype._handleTabKey = function () {
  // Tab key handling is done as follows:
  // 1. If any of the selections are multiline, just add one indent level to the
  //    beginning of all lines that intersect any selection.
  // 2. Otherwise, if any of the selections is a cursor or single-line range that
  //    ends at or after the first non-whitespace character in a line:
  //    - if indentation is set to tabs, just insert a hard tab before each selection.
  //    - if indentation is set to spaces, insert the appropriate number of spaces before
  //      each selection to get to its next soft tab stop.
  // 3. Otherwise (all selections are cursors or single-line, and are in the whitespace
  //    before their respective lines), try to autoindent each line based on the mode.
  //    If none of the cursors moved and no space was added, then add one indent level
  //    to the beginning of all lines.

  // Note that in case 2, we do the "dumb" insertion even if the cursor is immediately
  // before the first non-whitespace character in a line. It might seem more convenient
  // to do autoindent in that case. However, the problem is if that line is already
  // indented past its "proper" location. In that case, we don't want Tab to
  // *outdent* the line. If we had more control over the autoindent algorithm or
  // implemented it ourselves, we could handle that case separately.

  var instance = this.cm,
    selectionType = "indentAuto",
    selections = instance.listSelections();

  selections.forEach(function (sel) {
    if (sel.anchor.line !== sel.head.line) {
      // Case 1 - we found a multiline selection. We can bail as soon as we find one of these.
      selectionType = "indentAtBeginning";
      return false;
    } else if (sel.head.ch > 0 && sel.head.ch >= instance.getLine(sel.head.line).search(/\S/)) {
      // Case 2 - we found a selection that ends at or after the first non-whitespace
      // character on the line. We need to keep looking in case we find a later multiline
      // selection though.
      selectionType = "indentAtSelection";
    }
  });

  switch (selectionType) {
  case "indentAtBeginning":
    // Case 1
    CodeMirror.commands.indentMore(instance);
    break;

  case "indentAtSelection":
    // Case 2
    this._addIndentAtEachSelection(selections);
    break;

  case "indentAuto":
    // Case 3
    this._autoIndentEachSelection(selections);
    break;
  }
};

Sandbox.prototype._autoIndentEachSelection = function (selections) {
  // Capture all the line lengths, so we can tell if anything changed.
  // Note that this function should only be called if all selections are within a single line.
  var instance = this.cm,
    lineLengths = {};

  selections.forEach(function (sel) {
    lineLengths[sel.anchor.line] = instance.getLine(sel.anchor.line).length;
  });

  // First, try to do a smart indent on all selections.
  CodeMirror.commands.indentAuto(instance);

  // If there were no code or selection changes, then indent each selection one more indent.
  var changed = false,
    newSelections = instance.listSelections();
  if (newSelections.length === selections.length) {
    selections.forEach(function (sel, index) {
      var newSel = newSelections[index];
      if (CodeMirror.cmpPos(sel.anchor, newSel.anchor) !== 0 ||
        CodeMirror.cmpPos(sel.head, newSel.head) !== 0 ||
        instance.getLine(sel.anchor.line).length !== lineLengths[sel.anchor.line]) {
        changed = true;
        // Bail - we don't need to look any further once we've found a change.
        return false;
      }
    });
  } else {
    changed = true;
  }

  if (!changed) {
    CodeMirror.commands.indentMore(instance);
  }
};

Sandbox.prototype._addIndentAtEachSelection = function (selections) {
  var instance = this.cm,
    usingTabs = instance.getOption("indentWithTabs"),
    indentUnit = instance.getOption("indentUnit"),
    edits = [];

  selections.forEach(function (sel) {
    var indentStr = "",
      i, numSpaces;
    if (usingTabs) {
      indentStr = "\t";
    } else {
      numSpaces = indentUnit - (sel.anchor.ch % indentUnit);
      for (i = 0; i < numSpaces; i++) {
        indentStr += " ";
      }
    }
    edits.push({
      edit: {
        text: indentStr,
        start: sel.anchor
      }
    });
  });

  this._doMultipleEdits(edits);
};

Sandbox.prototype._doMultipleEdits = function (edits, origin) {
  var self = this;

  // Sort the edits backwards, so we don't have to adjust the edit positions as we go along
  // (though we do have to adjust the selection positions).
  edits.sort(function (editDesc1, editDesc2) {
    var edit1 = (Array.isArray(editDesc1.edit) ? editDesc1.edit[0] : editDesc1.edit),
      edit2 = (Array.isArray(editDesc2.edit) ? editDesc2.edit[0] : editDesc2.edit);
    // Treat all no-op edits as if they should happen before all other edits (the order
    // doesn't really matter, as long as they sort out of the way of the real edits).
    if (!edit1) {
      return -1;
    } else if (!edit2) {
      return 1;
    } else {
      return CodeMirror.cmpPos(edit2.start, edit1.start);
    }
  });

  edits.forEach(function(edit) {
    if (edit.end == null) {
      edit.end = edit.start;
    }
  });

  // Pull out the selections, in the same order as the edits.
  var result = edits;

  // Perform the edits.
  this.cm.operation(function () {
    edits.forEach(function (editDesc, index) {
      // Perform this group of edits. The edit positions are guaranteed to be okay
      // since all the previous edits we've done have been later in the document. However,
      // we have to fix up any selections that overlap or come after the edit.
      (function (edit) {
        if (edit) {
          self.cm.replaceRange(edit.text, edit.start, edit.end, origin);
        }
      })(editDesc.edit);
    });
  });
};
