var sys = require('sys'),
    Cradle = require('cradle'),
    email = require('mailer'),
    logger = require('node-logger').createLogger('mailer.log'),
    dbname = process.argv[2],
    db;

//
// set up connection
//
db = new Cradle.Connection().database(dbname);

//
// listen to changes feed using filter
//
logger.info( process.argv, dbname );
db.changes({ since: 2, filter: dbname + '/newest' })
  .on('response', function(resp) {
    resp.on('data', function(change) {
        logger.info("A change occurred: ", change);
        notify({ "id": change.id, "rev": change.changes[0].rev });
    });
    resp.on('end', function () {
        logger.info("Exiting...");
    });
});

function notify(doc) {
    email.send({
        host:     "localhost",
        port:     25,
        domain:   "localhost",
        to:       "me@some-email.com",
        from:     "someone@some-email.com",
        subject:  "New article submitted!",
        template: "./external/templates/email.mustache",
        data:     doc
    }, function(err, result) {
        if (err) throw err;
        logger.info("Email sent successfully!");
    });
}
