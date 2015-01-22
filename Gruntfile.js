// Generated on 2014-12-22 using generator-angular 0.10.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {// Project configuration.


grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-file-append');
grunt.loadNpmTasks('grunt-lineending');
grunt.loadNpmTasks('grunt-whitesource');



grunt.initConfig({
  uglify: {
    my_target: {
      files: {
        'bin/whitesource.js': ['bin/whitesource.js']
      }
    }
  },

  file_append: {
    default_options: {
      files: [
        function() {
          return {
            preappend: "\n/*\n//@ sourceMappingURL=testing2.js.map\n*/",
            input: 'bin/whitesource_.js',
            output:'bin/whitesource_2.js'
          };
        }
      ]
    }
  },

 lineending: {
    dist: {
      options: {
        //overwrite: true
      },
      files: {
        'bin/whitesource.js': 'bin/whitesource.js'
        //'package.json': ['package.json']
      }
    }
  },

  whitesource: {
    options: {
          'apiKey':'',
          'https':'',
          'baseURL':'',
          'port' :'',
          'productName':'',
          'productVersion':'',
          'productToken':'',
          'projectName':'',
          'projectVer':'',
          'projectToken':''
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },

});


  grunt.registerTask('default', [
    "whitesource"
    //'newer:jshint',
    /*'lineending',*/
    /*'uglify',*/
    /*'file_append:default_options'*/
  ]);
};
