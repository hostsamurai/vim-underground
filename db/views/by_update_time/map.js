function(doc) {
    if (doc.type === "script" && doc.pushed_at) {
        emit([doc.pushed_at, doc._id], {
            script:       doc.name,
            link:         doc.url,
            desc:         doc.description,
            last_updated: doc.pushed_at.slice(0, -6)
        });
    }
}
