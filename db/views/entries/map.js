function(doc) {
    if (doc.type === "feed" && doc.entries.length > 0) {
        emit(doc._id, doc.entries.reverse());
    }
}
