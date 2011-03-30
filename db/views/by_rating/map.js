function(doc) {
    if (doc.type === "script" && (doc.homepage || doc.url)) {
        emit([doc.rating, doc._id], {
            title:     doc.name,
            summary:   doc.description,
            link:      doc.homepage || doc.url,
            rating:    doc.rating,
            posted_on: doc.pushed_at
        });
    }
}
