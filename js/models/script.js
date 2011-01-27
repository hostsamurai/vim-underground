Script = Sammy('body').createModel('script');
Script.extend({
    viewByRating: function(options, callback) {
        return Script.view('by_rating', $.extend({
            startkey:       options.startkey || [10000, "a"],
            startkey_docid: options.startkey_docid || "a",
            limit:          options.limit || 10,
            descending:     true
        }, options || {}), callback);
    },

    viewByUpdateTime: function(options, callback) {
        return Script.view('by_update_time', $.extend({
            startkey:       options.startkey,
            startkey_docid: options.startkey_docid,
            limit:          options.limit || 10,
            descending:     true
        }, options || {}), callback);
    }
});
