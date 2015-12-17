'use strict';
 
var gulp = require('gulp');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var rename = require("gulp-rename");
var mainBowerFiles = require('main-bower-files');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('connect', function() {
  connect.server({
    root: 'www',
    port: 8000,
    livereload: true
  });
});
 

gulp.task('sass', function () {
  gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./www/css'));
});
 
gulp.task('watch', function () {
  gulp.watch('./scss/**/*.scss', ['sass']);
  gulp.watch('./www/*.html', ['html:reload']);
  gulp.watch('./www/css/*.css', ['css:reload']);
});

gulp.task('css:reload', function () {
  gulp.src('./www/css/*.css')
    .pipe(connect.reload());
});

gulp.task('html:reload', function () {
  gulp.src('./www/*.html')
    .pipe(connect.reload());
});

gulp.task('css:minify', function () {
 gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCss())
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(rename({
      suffix: ".min",
    }))
    .pipe(gulp.dest('./www/css'));
});

gulp.task('css:autoprefix', function () {
 gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCss())
    .pipe(rename({
      suffix: ".min",
    }))
    .pipe(gulp.dest('./www/css'));
});

gulp.task("bower-files", function(){
    gulp.src(mainBowerFiles())
      .pipe(uglify())
      .pipe(gulp.dest("./www/js/vendor"));
});


gulp.task('build', ['css:minify','bower-files']);


gulp.task('default', ['watch']);
