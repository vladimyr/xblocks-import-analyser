'use strict';

var fs     = require('fs'),
    Path   = require('upath'),
    spawn  = require('child_process').spawn,
    es     = require('event-stream'),
    concat = require('concat-stream');

module.exports.createStream = function(options, callback){
    if (arguments.length === 1) {
        callback = options;
        options = {};
    }

    var defPyPath = '/usr/local/bin/python2',
        pyPath    = options.pyPath || process.env.PYTHON_PATH || defPyPath;

    var setup2jsonScript = Path.resolve(__dirname, '../python/import-parser.py');

    var parser = spawn(pyPath, [ setup2jsonScript ]);

    function parseJSON(data){
        try {
            var importRecords = JSON.parse(data.toString());
            callback(null, importRecords);
        } catch(err){
            callback(err);
        }
    }

    parser.on('error', function(err){
        callback(err);
    });
    parser.stdout
        .pipe(concat(parseJSON));

    return parser.stdin;
};