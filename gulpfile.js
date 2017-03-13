const postcss = require('gulp-postcss')
const gulp = require('gulp')

gulp.task('css', function () {
  const plugins = [
    require('postcss-cssnext')({
      browsers: [
        'last 4 versions'
      ]
    })
  ]

  return gulp.src('css/*.css')
    .pipe(postcss(plugins))
    .pipe(gulp.dest('public/'))
})

gulp.task('watch-all', function () {
  return gulp.watch('css/*.css', ['css'])
})