function(doc, req) {
    feed = JSON.parse(req.body);

    doc['updated_at'] = new Date().getTime();
    doc['type']       = 'feed';
    doc['feed_id']    = feed.id;
    doc['links']      = feed.links;
    doc['status']     = feed.status;
    doc['subtitle']   = feed.subtitle;
    doc['title']      = feed.title;
    doc['updated_at'] = feed.updated;

    function addALink(obj, links) {
        for (index in obj.links) {
            link = obj.links[index];
            if (link.rel === "alternate" && link.type === "text/html") {
                obj['link'] = link;
            }
        }
    }

    addALink(doc, feed.links);

    for(var i = 0; i < feed.items.length; i+=1) {
        item = feed.items[i];
        addALink(item, item.links);

        doc['entries'].push(item);
        if (doc['entries'].length > 500) {
            doc['entries'].shift();
        }
    }

    return [doc, "thx!"];
}
