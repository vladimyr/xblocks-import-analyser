'use strict';

var fs   = require('fs'),
    Path = require('upath');

var importsParser = require('../lib/imports-parser.js');

var path = '../python/fixtures/imports.xblock-poll.py';
fs.createReadStream(Path.join(__dirname, path))
    .pipe(importsParser.createStream(function(err, importRecords){
        if (err) {
            console.error(err.message);
            console.error(err.stack);
            return;
        }

        console.log(JSON.stringify(importRecords, null, 2));
    }));