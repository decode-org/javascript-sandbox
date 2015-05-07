var renderer;
var errorElement = document.getElementById('sandbox-error');

function addError() {
  errorElement.className = 'active';
};

window.addEventListener('message', function(m) {
  var overrides = function() {
    var overridePoints = [
      {
        object: Text,
        props: ['text', 'fontSize', 'fontFamily', 'fontStyle', 'fontWeight', 'glyphx', 'glyphy', 'cap', 'fill', 'join', 'line', 'textStrokeWidth', 'miterLimit', 'selectable']
      },
      {
        object: TextSpan,
        props: ['text', 'fontSize', 'fontFamily', 'fontStyle', 'fontWeight', 'glyphx', 'glyphy', 'cap', 'fill', 'join', 'line', 'textStrokeWidth', 'miterLimit', 'selectable']
      },
      {
        object: Rect
      },
      {
        object: Circle
      },
      {
        object: Ellipse
      },
      {
        object: Group
      },
      {
        object: Polygon
      },
      {
        object: Star
      },
      {
        object: SpecialAttrPath
      },
      {
        object: Path
      }
    ];
    var defaultOverrides = ['matrix', 'opacity', 'rotation', 'origin', 'scale', 'scaleX', 'scaleY', 'x', 'y', 'filters'];
    var overrideProperty = function(ob, name) {
      Object.defineProperty(ob.prototype, name, {
        get: function() {
          return this.attr(name);
        },
        set: function(val) {
          return this.attr(name, val);
        }
      });

    };

    overridePoints.forEach(function(point) {
      defaultOverrides.forEach(function(name) {
        overrideProperty(point.object, name);
      });
    });

    (self || this).onerror = function(e, url, line, col, ob) {
      stage.sendMessage('error', { });
    };
  };

  try {
    var code = new Function('(' + overrides.toString() + ')(); ' + m.data);
    errorElement.className = '';
  } catch (e) {
    // Don't log this
    addError();
  }

  if (renderer) {
    renderer.destroy();
  }
  renderer = bonsai.run(document.getElementById('sandbox-output'), {
    code: code,
    width: 400,
    height: 400
  });

  renderer.on('load', function(e) {
    renderer.on('message:error', function(data) {
      addError();
    });
  });
});
