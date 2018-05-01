'use strict';

var gulp = require('gulp'),
    path = require('path'),
    del = require('del'),
    rename = require('gulp-rename'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    portfinder = require('portfinder'),
    postcss = require('gulp-postcss'),
    precss = require('precss'),
    nested = require('postcss-nested'),
    cssnext = require('postcss-cssnext'),
    browserSync = require("browser-sync"),
    concat = require('gulp-concat'),
    pug = require('gulp-pug'),
    inline  = require('postcss-inline-svg'),
    cache = require('gulp-cached'),
    image = require('gulp-imagemin'),
    eslint = require('gulp-eslint'),
    babel = require("gulp-babel"),
    sourcemaps = require('gulp-sourcemaps'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    exec = require('child_process').exec,
    gulpIgnore = require("gulp-ignore"),
    dependencies = require("gulp-dependents"),
    browserify = require("browserify");

var processors = [
  precss(),
  cssnext(),
  inline(),
  nested()
];

var surge_url = 'samo.dev.artmizu.ru';

// Ресурсы проекта
var paths = {
  styles: 'assets/source/styles/',
  css: 'assets/css/',
  scripts: 'assets/source/scripts/',
  js: 'assets/js/',
  templates: 'templates/',
  img: 'assets/source/img/',
  bundles: 'assets/img/',
  html: './',
};

// Одноразовая сборка проекта
gulp.task('default', function() {
  gulp.start('pug', 'styles', 'scripts', 'script-libs', 'img');
});

// Запуск живой сборки
gulp.task('live', function() {
  gulp.start('pug', 'styles', 'scripts', 'script-libs', 'img', 'watch', 'server');
});

// Сборка с публикацией
gulp.task('push', function() {
  gulp.start('pug-pretty', 'styles', 'scripts', 'script-libs', 'img', 'overview', 'publish');
});

// Федеральная служба по контролю за оборотом файлов
gulp.task('watch', function() {
  gulp.watch(paths.templates + '**/*.pug', ['pug']).on('change', browserSync.reload);
  gulp.watch([paths.styles + '**/*.pcss', paths.styles + '**/*.css'], ['styles']).on('change', browserSync.reload);;
  gulp.watch([paths.scripts + '**/*.js', '!' + paths.scripts + 'libs/*.js'], ['scripts']).on('change', browserSync.reload);;
  gulp.watch(paths.scripts + 'libs/*.js', ['scripts-libs']).on('change', browserSync.reload);;
  gulp.watch(paths.img + '/**/*.{png,jpg,gif,svg}', ['img']).on('change', function(event) {
    if (event.type === 'deleted') {
      del(paths.bundles + path.basename(event.path));
      delete cache.caches['img'][event.path];
    }
  });
});

// Сборка HTML'a с построением дерева зависимостей
gulp.task("pug", function() {
  gulp.src(paths.templates + "**/*.pug")
    .pipe(plumber({errorHandler: onError}))
    .pipe(cache("pug"))
    .pipe(dependencies({
      ".pug": {
        parserSteps: [
          /(?:\s*include\s+(.+$)|\s*extends\s+(.+$))/gm,
        ],
        postfixes: ['.pug']
      }
    }, { logDependents: true }))
    .pipe(gulpIgnore.include('**.pug'))
    .pipe(pug())
    .pipe(gulp.dest(paths.html));
});

// Сборка HTML'a для продакшена
gulp.task("pug-pretty", function() {
  gulp.src(paths.templates + "**/*.pug")
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulpIgnore.include('**.pug'))
    .pipe(pug({pretty: true}))
    .pipe(gulp.dest(paths.html));
});

// Компиляция стилей, добавление префиксов
gulp.task('styles', function () {
  gulp.src(paths.styles + 'style-manager.pcss')
    .pipe(plumber({errorHandler: onError}))
    .pipe(postcss(processors))
    .pipe(rename('style.css'))
    .pipe(gulp.dest(paths.css));
});

// Сборка и минификация своих скриптов
gulp.task('scripts', function() {
  return browserify(paths.scripts + "scripts.js", { debug: true, extensions: ['es6']})
    .transform("babelify", {presets: ['env']})
    .bundle()
    .on('error', onError)
    .pipe(source('scripts.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.js));
});

// Сборка и минификация скриптов библиотек
gulp.task('script-libs', function() {
  gulp.src(paths.scripts + '/libs/**/*.js')
    .pipe(plumber({errorHandler: onError}))
    .pipe(concat('min.libraries.js'))
    .pipe(gulp.dest(paths.js));
});

// Сжатие картинок
gulp.task('img', function() {
  return gulp.src(paths.img + '**/*')
    .pipe(cache('img'))
    .pipe(image())
    .pipe(gulp.dest(paths.bundles));
});

// Локальный сервер
gulp.task('server', function() {
  portfinder.getPort(function (err, port) {
    browserSync({
      server: {
        baseDir: "."
      },
      host: 'localhost',
      directory: true,
      notify: false,
      port: port
    });
  });
});

// Отправка на сервер
gulp.task('publish', function() {
  exec("surge . '" + surge_url + "'", function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
});

// Сборка страницы index.html со списком страниц
gulp.task('overview', function() {
  exec("ruby overview/generate.rb", function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
});

// Ошибки
var onError = function(error) {
  gutil.log([
    (error.name + ' in ' + error.plugin).bold.red,
    '',
    error.message,
    ''
  ].join('\n'));
  gutil.beep();
  this.emit('end');
};
