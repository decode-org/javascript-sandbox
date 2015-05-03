var gulp = require('gulp');
var server = require('gulp-webserver');
var autoprefixer = require('gulp-autoprefixer');
var umd = require('gulp-umd');
var merge = require('merge-stream');

gulp.task('js', function() {
  var main = gulp.src('src/js/main.js')
    .pipe(umd({
      dependencies: function () {
        return [
          {
            name: 'CodeMirror',
            amd: 'codemirror',
            cjs: 'codemirror',
            global: 'CodeMirror',
            param: 'CodeMirror'
          }
        ];
      },
      exports: function (file) {
        return 'Sandbox';
      }
    }));
  var output = gulp.src('src/js/output.js')
    .pipe(umd({
      exports: function (file) {
        return '\'Nothing Here\'';
      }
    }))
    .pipe(gulp.dest('dist'));

  return merge(main, output)
    .pipe(gulp.dest('./dist'));
});

gulp.task('css', function() {
  return gulp.src('src/css/*.css')
    .pipe(autoprefixer())
    .pipe(gulp.dest('dist'));
});

gulp.task('server', function() {
  return gulp.src('./')
    .pipe(server({
      directoryListing: true,
      open: true
    }));
});

gulp.task('watch', ['server'], function() {
  gulp.watch(['src/css/*.css'], ['css']);
  gulp.watch(['src/js/*.js'], ['js']);
});

gulp.task('default', ['js', 'css', 'watch']);
