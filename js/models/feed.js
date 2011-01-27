Feed = Sammy('body').createModel('feed');
Feed.extend({

    getEntries: function(options, callback) {
        return Feed.view('entries', $.extend({
            key: options.feed_id,
            limit: options.limit || 10
        }, options || {}), callback);
    }
});
