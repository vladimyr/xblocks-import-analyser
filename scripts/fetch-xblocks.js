'use strict';

var request = require('request'),
    es      = require('event-stream'),
    kramed  = require('kramed');

/**
 * original url:
 *  https://raw.githubusercontent.com/wiki/edx/edx-platform/List-of-XBlocks.md
 */
var XBlocks_List_URL = 'https://cdn.rawgit.com/wiki/edx/edx-platform/List-of-XBlocks.md';

function extractEntries(callback){
    callback = callback || Function.prototype;

    /**
     * example entry:
     *  * [Animation XBlock](https://github.com/pmitros/AnimationXBlock)
     */
    var regex = /^\*\s+\[(.*?)]\((.*?)\):\s+(.*?)$/;

    function filter(line){
        var matches = line.match(regex);
        if (!matches || matches.length !== 4)
            return;

        var name = matches[1],
            url  = matches[2],
            desc = matches[3];

        desc = kramed(desc.trim());
        desc = desc.replace(/\n$/, '');

        return {
            name: name,
            url:  url,
            desc: desc
        };
    }

    var inputStream = es.mapSync(filter);
    inputStream.pipe(es.writeArray(callback));

    return inputStream;
}

request.get(XBlocks_List_URL)
    .pipe(es.split())
    .pipe(extractEntries(function(err, entries){
        console.log(JSON.stringify(entries, null, 2));
    }));