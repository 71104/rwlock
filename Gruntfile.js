module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: {
			dist: {
				files: {
					src: [
						'lib',
						'doc'
					]
				}
			}
		},

		jshint: {
			options: {
				camelcase: true,
				curly: true,
				forin: true,
				freeze: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				quotmark: 'single',
				undef: true,
				unused: true,
				strict: true,
				trailing: true,
				boss: true,
				expr: true,
				multistr: true,
				smarttabs: true,
				shadow: true,
				node: true
			},
			dist: {
				files: {
					src: [
						'src/lock.js'
					]
				}
			}
		},

		uglify: {
			dist: {
				files: {
					'lib/lock.js': [
						'src/lock.js'
					]
				}
			}
		},

		yuidoc: {
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-yuidoc');

	grunt.registerTask('default', ['jshint', 'uglify']);
	grunt.registerTask('all', ['clean', 'jshint', 'uglify', 'yuidoc']);
};
