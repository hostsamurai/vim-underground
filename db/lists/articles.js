function(head, req) {
    var path = require('lib/path'),
        ddoc = this;

    provides("html", function () {
        var mustache = require('lib/mustache'),
            articles = [],
            row;

        while (row = getRow()) {
            var article = row.value,
                a = {
                    title:     article.title,
                    summary:   article.summary,
                    link:      article.link,
                    posted_on: article.posted_on
                };

            articles.push(a);
            key = row.key;
        }

        var stash = {
            articles: articles,
            key: key,
            older: function () { return path.older(key); }
        };

        return mustache.to_html(ddoc.templates["index.html"], stash, ddoc.templates.partials);
    });
}
