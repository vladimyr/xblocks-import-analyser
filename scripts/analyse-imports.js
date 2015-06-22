'use strict';

var analyseImports = require('../util/analyse-imports-from-git.js');

/**
 * examples:
 *
 *  pygments           ==> 'https://github.com/nex3/pygments/'
 *  xblock-poll        ==> 'https://github.com/mckinseyacademy/xblock-poll'
 *  xblock-image-modal ==> 'https://github.com/Stanford-Online/xblock-image-modal'
 */

var url = 'https://github.com/Stanford-Online/xblock-image-modal';

analyseImports(url, function(err, importsInfo){
    if (err) {
        console.error(err.message);
        console.error(err.stack);
        return;
    }

    console.log(JSON.stringify(importsInfo, null, 2));
});