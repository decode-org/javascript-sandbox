var gulp = require('gulp');
var server = require('gulp-webserver');

gulp.task('default', function() {
  return gulp.src('./')
    .pipe(server({
      livereload: true,
      directoryListing: true,
      open: true
    }));
});
