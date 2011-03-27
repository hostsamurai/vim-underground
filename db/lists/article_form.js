function(head, req) {
    var ddoc = this;

    provides("html", function () {
        return ddoc.templates.forms["article.html"];
    });

    provides("show", function () {
        return toJSON({ body: ddoc.templates.forms["article.html"] });
    });
}
