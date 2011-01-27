function(doc) {
    var regex = /script_id=(\d+)$/;

    if (doc.type === "script" && doc.homepage && regex.test(doc.homepage)) {
        emit(doc._id, {
            script_id: regex.exec(doc.homepage)[1],
            doc: doc
        });
    }
}
