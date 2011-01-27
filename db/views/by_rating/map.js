function(doc) {
    if (doc.type === "script" && doc.rating > 0) {
        emit([doc.rating, doc._id], {
            script:       doc.name,
            link:         doc.url,
            desc:         doc.description,
            last_updated: doc.pushed_at.slice(0, -6)
        });
    }
}
