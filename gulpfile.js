var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    replace = require('gulp-template-replace');

var path = require('path');

gulp.task('release', function () {
    //合并ui-lottery
    gulp.src(['./src/js/intro.js', './src/js/ui-lottery.js', './src/js/outro.js'])
        .pipe(concat('ui-lottery.js'))
        .pipe(gulp.dest('./dist/'));

    //生成min文件
    gulp.src(['./src/js/intro.js', './src/js/ui-lottery.js', './src/js/outro.js'])
        .pipe(concat('ui-lottery.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'));

    //处理ng-lottery.js
    gulp.src('./examples/js/ng-lottery.js')
        .pipe(replace([
            {
                "rule": "templateUrl: 'template/lottery-dial.ejs'",
                "file": path.join(__dirname, "./examples/template/lottery-dial.ejs"),
                "fileRead": function (text) {
                    return "template: " + text;
                }
            },
            {
                "rule": "templateUrl: 'template/lottery-tiger.ejs'",
                "file": path.join(__dirname, "./examples/template/lottery-tiger.ejs"),
                "fileRead": function (text) {
                    return "template: " + text;
                }
            }
        ]))
        .pipe(uglify())
        .pipe(rename('ng-lottery.min.js'))
        .pipe(gulp.dest('./examples/js/'));
});

gulp.task('default', function () {
});