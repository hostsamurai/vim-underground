function(doc) {
    if (doc.type == "screencast" && doc.summary && doc.approved) {
        emit([doc.posted_on, doc._id], {
            title:     doc.title,
            thumb_url: doc.thumb_url,
            html:      doc.html,
            link:      doc._id,
            posted_on: doc.posted_on
        });
    }
}
