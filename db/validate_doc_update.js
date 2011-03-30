function(newDoc, oldDoc, userCtx) {
    if (!newDoc._deleted) {
        function require(field, message) {
            if (field instanceof Array) {
                for(i = 0; i < field.length; i += 1) {
                    value = field[i];

                    if (typeof value === 'string') {
                        message = "Document must have a " + field[i];
                        if (!newDoc.hasOwnProperty(value) && value !== "docs") throw({ forbidden: message });

                    } else if (value instanceof Object) {
                        for (key in value) {
                            message = value[key];
                            if (!newDoc.hasOwnProperty(key)) throw({ forbidden: message });
                        }
                    }
                }
            } else if (typeof field === "string") {
                message = message || "Document must have a " + field;
                if (!newDoc.hasOwnProperty(field)) throw({ forbidden: message });
            }
        }

        require('type');

        switch (newDoc.type) {
        case "article":
            require(['title', 'summary', 'approved',
                    { 'posted_on': "You must specify the time this article was created." }]);
            break;
        case "screencast":
            require(['title', 'summary', 'thumb_url', 'html', 'approved']);
            break;
        case "feed":
            require(['url', 'entries']);
            break;
        case "script":
            require(['url', 'homepage', 'created_at', 'name', 'description']);
            break;
        default:
            throw({ invalid: "invalid document provided." });
        }
    }
}
