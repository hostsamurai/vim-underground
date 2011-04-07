var sys = require('sys'),
    util = require('util'),
    cradle = require('cradle'),
    scraper = require('scraper'),
    offset = "0",
    docs = [],
    db;


//
// Check command line arguments and setup couchDB connection if valid
//
function checkArgs() {
    var user = "",
        pass = "",
        match;

    if (process.argv[2] && (match = /(\w+):(\w+)/.exec(process.argv[2]))) {
        user = match[1];
        pass = match[2];
        setup(user, pass);
    } else {
        sys.puts("You must specify user:pass when calling this script.");
        process.exit(1);
    }

    if (process.argv[3]) {
        offset = process.argv[3];
    }
}


function setup(user, pass) {
    db = new(cradle.Connection)('127.0.1.1', '5984', {
        auth: { username: user, password: pass }, raw: true
    }).database('underground-git');
}

//
// Retrieve rating and # of downloads for 500 scripts at a time
//
function scrape(docs, callback) {
    var url = 'http://vim.sourceforge.net/scripts/script_search_results.php' +
              '?order_by=rating&show_me=500&result_ptr=' + offset,
        processed = 0;

    scraper(url, function(err, $) {
        if (err) throw err;

        var script_id,
            script;

        sys.puts("================================================");
        sys.puts("Currently scraping: " + url);
        sys.puts("================================================");

        $('table:nth(6) tr:gt(1)').each(function(i) {
            $sel = $(this);

            if ($sel.find('td').length > 2) {
                script_id = /script_id=(\d+)$/.exec($sel.find('td:first a').attr('href'))[1];
                script = $sel.find('td:first a').text();
                processed += 1;

                if (docs[script_id]) {
                    docs[script_id].rating = parseInt($sel.find('td:nth-child(3)').text());
                    docs[script_id].downloads = parseInt($sel.find('td:nth-child(4)').text());
                }
            }

            // Look ahead to the next table row on the page.
            // If the row contains less than 5 columns, it means we're looking
            // at the last row on the table, containing no script data
            if ($(this).next('tr').find('td').length < 5) callback(docs);
        });
    });
}


//
// Remove any null values from the array housing the docs
//
function prepareDocs(d) {
    d = d.filter(function(val) {
        if (val !== undefined) return val;
    });

    return d;
}


function bulkUpdate(d) {
    db.save(d, function(err, res) {
        if (err) throw err;
        sys.puts("Performing bulk update for " + d.length + " scripts ...");
    });
}


//
// Getting down to business...
//
checkArgs();


db.view('underground-git/all_scripts', function(err, res) {
    if (err) throw err;

    var results_length = res.rows.length,
        i = 0,
        script_id,
        doc = {};

    sys.puts("Fetching scripts from couchdb...");

    for(; i<results_length; i+=1) {
        script_id = parseInt( res.rows[i].value.script_id );
        doc = res.rows[i].value.doc;

        docs[script_id] = doc;

        if (docs[script_id].rating === undefined) docs[script_id].rating = 0;
        if (docs[script_id].downloads === undefined) docs[script_id].downloads = 0;
    }

    scrape(docs, function(updates) {
        var newDocs = prepareDocs(updates);
        bulkUpdate(newDocs);
    });
});
