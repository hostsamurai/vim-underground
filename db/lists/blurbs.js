function(head, req) {
    var path = require('lib/path').init(req),
        utils = require('lib/utils'),
        ddoc = this;

    function list(format) {
        var mustache = require('lib/mustache'),
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
                heading:    req.query.heading,
                rows:       rows,
                type:       req.query.type,
                key:        key,
                scripts:    req.query.type === "t-scripts" ? true : false,
                page_title: req.query.pageTitle,
                bottom_row: req.query.bottomRow,
                older:      function ()  { return path.older(key); }
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

    provides("atom", function () {
        var atom = require('lib/atom'),
            row = getRow(),
            type = /(\w+)/.exec(req.query.title)[0].toLowerCase(),
            feedHeader = atom.header({
                updated: (row ? new Date(row.value.posted_on) : new Date()),
                title:  "Vim Underground " + req.query.title,
                feed_id:  path.absolute('/articles'),
                feed_link: path.absolute('/articles-feed')
            });

        send(feedHeader);

        if (row) {
            do {
                var validDate = utils.getParsableDate(row.value.posted_on),
                    feedEntry = atom.entry({
                        entry_id:  encodeURIComponent(row.id),
                        title:     row.value.title,
                        author:    row.value.author,
                        content:   row.value.summary || "<img src=" + row.value.thumb_url + "></img>",
                        updated:   new Date(validDate),
                        alternate: row.id
                    });

                send(feedEntry);
            } while (row = getRow());
        }

        return '</feed>';
    });
}
