function(doc) {
    var summary;

    if (doc.type === "article" && doc.summary && doc.approved) {
        doc.summary.length > 270  ? summary = doc.summary.substring(0,270) + '&hellip;'
                                  : summary = doc.summary;

        emit([doc.posted_on, doc._id], {
            title:     doc.title,
            summary:   summary,
            link:      doc._id,
            posted_on: doc.posted_on
        });
    }
}
