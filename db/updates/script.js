function(doc, req) {
    doc.pushed_at = req.query.pushed_at;
    return [doc, "updated " + doc.name + "'s update time to " + req.query.pushed_at];
}
