var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var umd = require('gulp-umd');
var merge = require('merge-stream');
var bs = require('browser-sync').create();

gulp.task('js', function() {
  var main = gulp.src('src/js/sandbox.js')
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
      }
    }));

  var output = gulp.src('src/js/output.js');

  return merge(main, output)
    .pipe(gulp.dest('./dist'))
    .pipe(bs.reload({ stream: true }));
});

gulp.task('css', function() {
  return gulp.src('src/css/*.css')
    .pipe(autoprefixer())
    .pipe(gulp.dest('dist'))
    .pipe(bs.reload({ stream: true }));
});

gulp.task('serve', function() {
  bs.init({
    server: './',
    open: false,
  });
});

gulp.task('watch', ['serve'], function() {
  gulp.watch(['src/css/*.css'], ['css']);
  gulp.watch(['src/js/*.js'], ['js']);
  gulp.watch('**/*.html', bs.reload);
});

gulp.task('default', ['js', 'css', 'watch']);
