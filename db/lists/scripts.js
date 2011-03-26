function(head, req) {
    var path = require('lib/path'),
        ddoc = this;

    function list(format) {
        var mustache = require('lib/mustache'),
            utils = require('lib/utils'),
            scripts = [],
            rows = [],
            i = 0,
            script,
            a,
            row,
            stash;

        while (row = getRow()) {
            script = row.value;
            a = {
                title:      utils.truncateTitle(script.title),
                summary:    utils.truncateDesc(script.summary),
                link:       script.link,
                posted_on:  script.posted_on,
                short_date: utils.shortDate(script.posted_on)
            };

            scripts.push(a);
            key = row.key;
        }

        // split scripts into an array of arrays representing rows
        while (i < req.query.rows) {
            rows.push({ articles: scripts.splice(0,req.query.cols) });
            i += 1;
        }

        stash = {
            rows: rows,
            key: key,
            older: function () { return path.older(key); }
        };

        return mustache.to_html(ddoc.templates.partials.articles, stash);
    }

    provides("html", function () {
        return list("html");
    });

    // for access from jquery.couch
    provides("json", function () {
        return toJSON({ body: list("json") });
    });
}
