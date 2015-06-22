'use strict';

var Url      = require('fast-url-parser'),
    request  = require('request'),
    analyser = require('../lib/import-analyser.js');

Url.join = require('url-join');

function analyseImports(ghUrl, callback){
    var url = Url.join(ghUrl, '/archive/master.zip');
    request.get(url)
        .pipe(analyser.createStream(callback));
}

module.exports = analyseImports;
