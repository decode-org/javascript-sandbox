var sandbox = new Sandbox(document.querySelector('section.code-container'), document.getElementById('output-frame'));
var recoder = new Recode.Recoder();
var data = null;
var cm = sandbox.cm;

// Stolen from the recode-brackets extension
// This function *tries* to handle multiple selections
// Newlines tend to break that
cm.on("changes", function (cm, changelist) {
  if (recoder.recording) {
    var first = true;

    // Make sure the changes are in order
    // So we can adjust for changes in position
    // As all changes are in in pre-change coordinates
    if (changelist.length > 1) {
      changelist = changelist.slice().sort(function (a, b) {
        if ((a.to.line > b.from.line) || ((a.to.line == b.from.line) && (a.to.ch > b.from.ch))) {
          return 1;
        } else if ((a.to.line == b.from.line) && (a.to.ch == b.from.ch)) {
          return 0;
        } else {
          return -1;
        }
      });
    }

    var offsets = {},
      rowOffset = 0;

    for (var i in changelist) {
      var change = changelist[i];

      var offset = 0;

      if (!first) {
        offset = offsets[String(change.from.line)] || 0;
      }

      var event = {
        data: change.text,
        position: {
          row: change.from.line,
          col: change.from.ch + offset
        },
        length: {
          row: change.to.line - change.from.line,
          col: (change.to.ch + ((change.from.line == change.to.line) ? offset : 0)) - (change.from.ch + offset)
        },
        mode: 0
      };

      var addOffset = change.text[change.text.length - 1].length - ((change.from.line == change.to.line) ? change.to.ch - change.from.ch : change.to.ch);

      offsets[String(change.to.line)] = (offsets[String(change.to.line)] || 0) + addOffset;

      // It appears that line values are in a post-change coordinate system
      // rowOffset += change.text.length - (change.to.line - change.from.line);

      if (!first) {
        event.distance = 0;
      }

      recoder.addAction(event);

      first = false;
    }
  }
});

cm.on("cursorActivity", function (cm) {
  if (recoder.recording) {
    var sel = cm.listSelections()[0];
    recoder.addAction({
      mode: 1,
      position: {
        row: sel.anchor.line,
        col: sel.anchor.ch
      },
      length: {
        row: sel.head.line - sel.anchor.line,
        col: sel.head.ch - sel.anchor.ch
      }
    });
  }
});

function startRecode() {
  if (!recoder.recording) {
    recoder.start();
    recoder.files = [
      {
        name: 'Main',
        path: 'main',
        language: 'html',
        content: cm.getValue()
      }
    ];
    recoder.addAction({
      mode: 2,
      data: 'main',
      distance: 0
    });
    sandbox.container.classList.add('recording');
  }
}

function stopRecode() {
  if (recoder.recording) {
    data = recoder.stop();
    sandbox.container.classList.remove('recording');

    var elem = document.createElement('a');
    elem.setAttribute('href', 'data:application.json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
    elem.setAttribute('download', 'recorddata.json');
    elem.click();
  }
}

cm.addKeyMap({
  'Ctrl-Alt-T': function() {
    if (recoder.recording) {
      stopRecode();
    } else {
      startRecode();
    }
  }
});
