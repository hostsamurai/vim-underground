var forever = require('forever'),
    util = require('util'),
    path = require('path');
    child = new forever.Forever(path.join(__dirname, '.', 'mailer.js'), {
        silent: true,
        forever: true,
        options: [process.argv[2]]
    });

child.on('exit', function () {
    console.log("Exiting...");
});

child.start();
