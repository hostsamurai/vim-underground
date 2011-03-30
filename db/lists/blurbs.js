function(head, req) {
    var path = require('lib/path'),
        ddoc = this;

    function list(format) {
        var mustache = require('lib/mustache'),
            utils = require('lib/utils'),
            len = req.query.trlen,
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
                title:      utils.truncateTitle(blurb.title, len),
                alt:        blurb.title,
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
        if (blurbs.length > 0) {
            while (i < req.query.rows) {
                rows.push({ blurbs: blurbs.splice(0,req.query.cols) });
                i += 1;
            }

            stash = {
                heading: req.query.heading,
                rows: rows,
                type: req.query.type,
                key: key,
                bottom_row: req.query.bottomRow,
                older: function () { return path.older(key); }
            };

            return req.query.page === "index" ?
                mustache.to_html(ddoc.templates["index.html"], stash, ddoc.templates.partials) :
                { body: mustache.to_html(ddoc.templates.partials.blurbs, stash), key: stash.key };
        } else {
            return req.query.page === "index" ? '' : { body: '', key: '' };
        }
    }

    provides("html", function () {
        return list();
    });

    // for access from jquery.couch
    provides("json", function () {
        return toJSON(list());
    });
}
