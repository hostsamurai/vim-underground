function(doc, req) {
    if (/(?:article|screencast)/.test(doc.type) && doc.approved === false) {
        return true;
    }
    return false;
}
