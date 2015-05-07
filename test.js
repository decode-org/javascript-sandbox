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

    // Make sure the changes are in reverse order
    // So we don't have to worry about post-change
    // Cordinates
    if (changelist.length > 1) {
      changelist = changelist.slice().sort(function (a, b) {
        if ((a.to.line > b.from.line) || ((a.to.line == b.from.line) && (a.to.ch > b.from.ch))) {
          return -1;
        } else if ((a.to.line == b.from.line) && (a.to.ch == b.from.ch)) {
          return 0;
        } else {
          return 1;
        }
      });
    }

    changelist.forEach(function(change) {
      var event = {
        data: change.text,
        position: {
          row: change.from.line,
          col: change.from.ch
        },
        length: {
          row: change.to.line - change.from.line,
          col: change.to.ch  - change.from.ch
        },
        mode: 0
      };

      if (!first) {
        event.distance = 0;
      }

      recoder.addAction(event);

      first = false;
    });
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
        language: 'js',
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
