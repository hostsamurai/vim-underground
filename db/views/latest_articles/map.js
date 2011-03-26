function(doc) {
    if (doc.type === "article" && doc.summary && doc.approved) {
        emit([doc.posted_on, doc._id], {
            title:     doc.title,
            summary:   doc.summary,
            link:      doc._id,
            posted_on: doc.posted_on
        });
    }
}
