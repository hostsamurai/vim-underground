var request = require('request');

var stdin = process.openStdin();

stdin.setEncoding('utf8');

stdin.on('data', function(d) {
    var data = JSON.parse(d),
        reqBody = JSON.parse(data.body);

    var response = function(code, msg) {
        var resp = {
            headers: { 'Content-Type': 'application/json' },
            body: msg
        };

        return process.stdout.write(JSON.stringify({ code: code, json: resp }) + '\n');
    };

    var options = {
        uri: 'http://localhost:9200/' + data.info.db_name + '/' + reqBody.index + '/_search',
        json: reqBody.query
    };

    request(options, function(err,res,body) {
        if (err) throw err;
        response(res.statusCode, body);
    });
});

