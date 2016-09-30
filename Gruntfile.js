
module.exports = function(grunt){

    grunt.initConfig({
        
        concat: {
            dist: {
                src: [
                    'js/intro.js',
                    'js/helpers/*.js',
                    'js/components/*.js',
                    'js/AreaSelection.js',
                    'js/outro.js'
                ],
                dest: 'js/AreaSelection.build.js',
            },
        },

        watch: {

            js: {
                files: ['js/**/*.js'],
                tasks: ['concat'],
                options: {
                    spawn: false
                }
            }
        },

    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);
    grunt.registerTask('dev', ['default','watch']);


}
