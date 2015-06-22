'use strict';

var fs     = require('fs'),
    Path   = require('upath'),
    spawn  = require('child_process').spawn,
    concat = require('concat-stream');

function parseSetup(options, callback){
    if (arguments.length === 1) {
        callback = options;
        options = {};
    }

    var defPyPath = '/usr/local/bin/python2',
        pyPath    = options.pyPath || process.env.PYTHON_PATH || defPyPath;

    var setup2jsonScript = Path.resolve(__dirname, '../python/setup2json.py');

    var parser = spawn(pyPath, [ setup2jsonScript ]);

    function parseJSON(data){
        try {
            callback(null, JSON.parse(data.toString()));
        } catch(err){
            callback(err);
        }
    }

    parser.on('error', callback);
    parser.stdout
        .pipe(concat(parseJSON));

    return parser.stdin;
}

module.exports = {
    createStream: parseSetup
};