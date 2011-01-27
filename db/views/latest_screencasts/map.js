function(doc) {
    var summary;

    if (doc.type == "screencast" && doc.summary && doc.approved) {
        doc.summary.length > 270  ? summary = doc.summary.substring(0,270) + '&hellip;'
                                  : summary = doc.summary;

        emit([doc.posted_on, doc._id], {
            title:     doc.title,
            summary:   summary,
            link:      doc._id,
            html:      doc.html,
            thumb_url: doc.thumb_url,
            posted_on: doc.posted_on
        });
    }
}
