function(doc) {
    if (doc.type === "script" && (doc.homepage || doc.url)) {
        emit([doc.pushed_at, doc._id], {
            title:     doc.name,
            summary:   doc.description,
            link:      doc.homepage || doc.url,
            posted_on: doc.pushed_at
        });
    }
}
