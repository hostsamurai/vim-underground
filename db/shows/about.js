function(doc, req) {
    var mustache = require('lib/mustache'),
        ddoc = this,
        stash = {
            page_title: "About",
            about: ddoc.templates["about.html"]
        };

    return mustache.to_html(ddoc.templates["index.html"],
                            stash, ddoc.templates.partials);
}
