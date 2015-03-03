var gulp = require('gulp');
var server = require('gulp-webserver');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('js', function() {
  return gulp.src('src/js/*.js')
    .pipe(gulp.dest('dist'));
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
