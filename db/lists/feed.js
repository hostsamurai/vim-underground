function(head, req) {
    // call with underground/_design/underground/_list/feed/latest?limit=20&descending=true
    var type = req.query.type.charAt(0).toUpperCase() + req.query.type.slice(1);

    provides("xml", function() {
       send('<feed xmlns="http://www.w3.org/2005/Atom" >' +
            '<title>Vim Underground ' + type + ' Feed</title>');

        while (row = getRow()) {
           var entry = new XML("<entry/>");
           entry.id = row.id;
           entry.updated = row.value.posted_on;
           entry.link = row.value.link;
           entry.title = row.value.title;
           entry.summary = type === "Article" ? row.value.summary : row.value.description;
           send(entry);
        }

        return "</feed>\n";
    });
}
