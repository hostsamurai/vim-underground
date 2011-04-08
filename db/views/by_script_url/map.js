function(doc) {
    if (doc.type === "script") emit(doc.url, null);
}
