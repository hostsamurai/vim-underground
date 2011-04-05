var email = require('mailer'),
    sys = require('sys');

var stdin = process.openStdin();

stdin.setEncoding('utf8');

stdin.on('data', function(d) {
    var data = JSON.parse(d);

    var response = function(code, msg) {
        var resp = {
            headers: { 'Content-Type': 'application/json' },
            body: msg
        };

        return process.stdout.write(JSON.stringify({ code: code, json: resp }) + '\n');
    }

    if (data.form.lol1 || data.form.lol2) {
        response(500, "Email not sent!");
    } else if (!(data.form.email && data.form.sender && data.form.message && data.form.subject)) {
        response(500, "Whoops! There was an error sending the email!");
    } else {
        email.send({
            host:    'localhost',
            port:    25,
            body:    data.form.message,
            from:    data.form.email,
            to:      "me@some-email.com",
            subject: data.form.subject
        }, function(err, msg) {
            if (err) throw err;
            response(200, "Email sent!!");
        });
    }
});
