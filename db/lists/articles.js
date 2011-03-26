function(head, req) {
    var path = require('lib/path'),
        ddoc = this;

    provides("html", function () {
        var mustache = require('lib/mustache'),
            utils = require('lib/utils'),
            articles = [],
            rows = [],
            i = 0,
            article,
            a,
            row,
            stash;

        while (row = getRow()) {
            article = row.value;
            a = {
                title:      utils.truncateTitle(article.title),
                summary:    utils.truncateDesc(article.summary),
                link:       article.link,
                posted_on:  article.posted_on,
                short_date: utils.shortDate(article.posted_on)
            };

            articles.push(a);
            key = row.key;
        }

        // split articles into an array of arrays representing rows
        while (i < req.query.rows) {
            rows.push({ articles: articles.splice(0,5) });
            i += 1;
        }

        stash = {
            rows: rows,
            key: key,
            older: function () { return path.older(key); }
        };

        return mustache.to_html(ddoc.templates["index.html"], stash, ddoc.templates.partials);
    });
}
