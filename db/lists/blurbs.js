function(head, req) {
    var path = require('lib/path'),
        ddoc = this;

    function list(format) {
        var mustache = require('lib/mustache'),
            utils = require('lib/utils'),
            blurbs = [],
            rows = [],
            i = 0,
            blurb,
            b,
            row,
            stash;

        while (row = getRow()) {
            blurb = row.value;
            b = {
                title:      utils.truncateTitle(blurb.title),
                summary:    utils.truncateDesc(blurb.summary),
                thumbnail:  blurb.thumb_url,
                link:       blurb.link,
                posted_on:  blurb.posted_on,
                short_date: utils.shortDate(blurb.posted_on)
            };

            blurbs.push(b);
            key = row.key;
        }

        // split blurbs into an array of arrays representing rows
        while (i < req.query.rows) {
            rows.push({ blurbs: blurbs.splice(0,req.query.cols) });
            i += 1;
        }

        stash = {
            heading: req.query.heading,
            rows: rows,
            key: key,
            older: function () { return path.older(key); }
        };

        return req.query.page === "index" ?
            mustache.to_html(ddoc.templates["index.html"], stash, ddoc.templates.partials) :
            mustache.to_html(ddoc.templates.partials.blurbs, stash);
    }

    provides("html", function () {
        return list("html");
    });

    // for access from jquery.couch
    provides("json", function () {
        return toJSON({ body: list("json") });
    });
}
