'use strict';

var Path          = require('upath'),
    JSZip         = require('jszip'),
    _             = require('lodash'),
    es            = require('event-stream'),
    concat        = require('concat-stream'),
    streamifier   = require('streamifier'),
    setupParser   = require('./setup-parser.js'),
    importsParser = require('./imports-parser.js');


module.exports.createStream = function(callback){
    callback = callback || Function.prototype;

    var allImportRecords = [];

    var setupFile, pyFiles = [];

    function filterPyFiles(pkgPaths){
        return pyFiles.filter(function(pyFile){
            var matches = pkgPaths.filter(function(pkgPath){
                return pyFile._path.indexOf(pkgPath) === 0;
            });

            return matches.length > 0;
        });
    }

    function collectSetupInfo(err, setupInfo){
        if (err) {
            callback(err);
            return;
        }

        // use packages array if available
        if (Array.isArray(setupInfo.packages)) {
            var pkgs = setupInfo.packages;

            // change packages array according to package_dir
            if (typeof setupInfo.package_dir === 'object' && !setupInfo.__code__) {
                var pkgDir = setupInfo.package_dir;

                pkgs = pkgs.map(function(pkg){
                    return pkgDir[pkg] || pkg;
                });
            }

            // get package paths
            var pkgPaths = pkgs.map(function(pkg){
                return pkg.replace(/\./g, '/');
            });

            pyFiles = filterPyFiles(pkgPaths);
        }

        function analyseImports(){
            function addFileInfo(pyFile, callback){
                var path     = pyFile._path,
                    filename = Path.basename(path);

                return function(err, importRecords){
                    if (err) {
                        callback(err);
                        return;
                    }

                    importRecords.forEach(function(imporRec){
                        imporRec.path = path;
                        imporRec.filename = filename;
                    });

                    allImportRecords = allImportRecords.concat(importRecords);
                    callback();
                };
            }

            return function analyser(pyFile, callback){
                streamifier.createReadStream(pyFile.asNodeBuffer())
                    .pipe(importsParser.createStream(addFileInfo(pyFile, callback)))
                    .on('error', callback);
            };
        }

        function processImportRecords(){
            var importsInfo = {
                modules: [],
                imports: allImportRecords
            };

            allImportRecords.forEach(function(importRec){
                // discard local imports
                var modules = importRec.modules.filter(function(module){
                    return module.indexOf('.') !== 0;
                });

                // use lodash to ensure uniqueness
                importsInfo.modules = _.union(importsInfo.modules, modules);
            });

            // lexically sort imported modules
            importsInfo.modules.sort();

            callback(null, importsInfo);
        }

        es.readArray(pyFiles)
            .pipe(es.map(analyseImports()))
            .on('error', callback)
            .on('end', processImportRecords);
    }

    function processZipData(buffer){
        var zip   = new JSZip(buffer),
            paths = Object.keys(zip.files);

        var rootDir;

        function isTestFile(path){
            var filename = Path.basename(path);

            return (/^tests?\//).test(path) ||
                /^test_/.test(filename)     ||
                /tests?.py$/.test(filename);
        }

        paths.forEach(function(path){
            // normalize path
            path = path.replace(/\\/g, '/');

            var item = zip.files[path];

            if (item.dir && path.indexOf('/') === path.lastIndexOf('/')){
                rootDir = path;
                return;
            }

            if (item.dir)
                return;

            var basename = Path.basename(path);
            if (/\.py$/.test(basename)){
                if (basename === 'setup.py') {
                    setupFile = item;
                } else {
                    item._path = path.substr(rootDir.length);
                    if (!isTestFile(item._path))
                        pyFiles.push(item);
                }
            }
        });

        if (!setupFile){
            var err = new Error('File "setup.py" is not found!');
            callback(err);
            return;
        }

        streamifier.createReadStream(setupFile.asNodeBuffer())
            .pipe(setupParser.createStream(collectSetupInfo));
    }

    return concat({ encoding: 'buffer' }, processZipData);
};

