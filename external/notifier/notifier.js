/**
 * Daemonizes the requested script
 *
 * Call with:
 *   $ forever this_script env my_script.js
 *
 */
var forever = require('forever'),
    util = require('util'),
    path = require('path');
    child = new forever.Forever(path.join(__dirname, '.', process.argv[3]), {
        silent: true,
        forever: true,
        options: [process.argv[2]]
    });

child.on('exit', function () {
    console.log("Exiting...");
});

child.start();
