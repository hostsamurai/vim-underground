function(doc, req) {
    return doc._id === "vim-script-feed" && doc.type === "feed" ? true : false;
}
