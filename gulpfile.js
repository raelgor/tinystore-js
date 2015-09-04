var gulp = require('gulp'),     concat = require('gulp-concat'),     uglify = require('gulp-uglify'),     ngAnnotate = require('gulp-ng-annotate'),     fs = require('fs'),     minifyCSS = require('gulp-minify-css');  gulp.task('css', function () {

    setTimeout(function () {
         gulp.src(['cardo.css', 'opensans.css', 'style.css', 'styles.css', 'css/**/*.css'])               .pipe(concat('styles.css'))               .pipe(minifyCSS())               .pipe(gulp.dest('assets/source'));

    }, 2000);
 });  gulp.task('js', function () {
     setTimeout(function () {
         gulp.src(['js/jquery.js', 'js/main.js', 'js/**/*.js'])           .pipe(concat('app.js'))           .pipe(uglify())           .pipe(ngAnnotate())           .pipe(gulp.dest('assets/source'))
     }, 2000);  });  gulp.task('watch:js', ['js'], function () {
    gulp.watch('js/**/*.js', ['js']);
});  gulp.task('watch:css', ['css'], function () {
    gulp.watch('css/**/*.css', ['css']);
});  gulp.task('dev', ['watch:css', 'watch:js']);