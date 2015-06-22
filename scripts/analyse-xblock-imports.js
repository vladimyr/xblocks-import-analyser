'use strict';

var xblocks = require('../xblocks.json'),
    es      = require('event-stream'),
    fs      = require('fs'),
    Url     = require('fast-url-parser'),
    Path    = require('upath');

var analyseImports = require('../util/analyse-imports-from-git.js');

var failed = [];

es.readArray(xblocks)
    .pipe(es.map(function(xblock, callback){
        var url      = Url.parse(xblock.url),
            filename = Path.basename(url.pathname) + '.json',
            path     = Path.join(__dirname, 'results', filename);

        analyseImports(xblock.url, function complete(err, importsInfo){
            if (err) {
                failed.push(filename);
                callback(err);
                return;
            }

            var importsJSON = JSON.stringify(importsInfo, null, 2);

            console.log('Writing imports file:', filename);
            fs.writeFile(path, importsJSON, callback);
        });
    }))
    .on('error', function(err){
        console.error(err.message);
        console.error(err.stack);
    })
    .on('end', function(){
        console.log('All files written! :)');
    });