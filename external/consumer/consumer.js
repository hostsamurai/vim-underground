var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    Cradle = require('cradle'),
    request = require('request'),
    email = require('mailer'),
    logger = require('node-logger').createLogger(
        path.join(__dirname, '../../log/notifier.log')
    );


var Consumer = function(env) {
    this.env = env;
    this.db;
}

Consumer.prototype = {
    /**
     * Read the couchapprc in the current working directory to set up
     * a new CouchDB connection.
     *
     */
    configure: function () {
        var config = fs.readFileSync(path.join(__dirname, '../../.couchapprc' ), 'utf8'),
            dbname, user, pass, host, port, c, match;

        // scrub comments so parsing doesn't fail
        config = config.replace(/\s\/\/.*/mg, '');
        c = JSON.parse(config).env[this.env];

        match  = /http:\/\/(.*):(.*)@(.*):(.*)\/(.*)/.exec(c.db);
        user   = match[1];
        pass   = match[2];
        host   = match[3];
        port   = match[4];
        dbname = match[5];

        this.db = new Cradle.Connection(host, port, {
            auth: { username: user, password: pass },
            raw: true
        }).database(dbname);

        return this.db;
    },

    /**
     * Track _changes and respond accordingly
     *
     * @param {Object} options Any options to pass to the _changes query
     * @param {Function} callback The logic to perform once we retrieve changes
     */
    listenForChanges: function(options, callback) {
        var ctx = this;

        if (options.filter) options.filter = ctx.db.name + '/' + options.filter;

        ctx.db.changes(options).on('response', function(resp) {
            resp.on('data', function(change) {
                callback(change);
            });
            resp.on('end', function () {
                logger.info("Exiting...");
            });
        });
    }
}

var FeedConsumer = exports.FeedConsumer = function(env) {
    this.env = env;
    this.db;
    return this;
}

FeedConsumer.prototype = {
    /**
     * Tracks _changes and updates script records' last update time.
     *
     * @param {string} feed The name of the feed record
     * @param {Object} options Any options to pass to _changes
     */
    listenForChanges: function(feed, options) {
        var ctx = this;

        Consumer.prototype.listenForChanges.call(this, options, function(change) {
            logger.info("A change occurred: ", change);
            if (change.id === feed) ctx.updateScripts(change.id);
        });
    },

    /**
     * Sets up a CouchDB connection by calling the parent Consumer object.
     *
     * @returns {Object} `this`
     */
    configure: function () {
        this.db = Consumer.prototype.configure.call(this);
        return this;
    },

    /**
     * Update an existing script's last update time. If the script
     * doesn't exist in the db, create it.
     *
     * @param {string} feed The name of the scripts feed
     */
    updateScripts: function(feed) {
        var ctx = this;

        ctx.db.get(feed, function(err, doc) {
            var changes = doc.status.entriesCountSinceLastMaintenance,
                i = 0,
                script,
                url;

            while (i < changes) {
                permalink = doc.entries[i].permalinkUrl;
                url       = /(\S.*)\/(\S.*\/){1}/.exec(permalink)[1];
                script    = /vim-scripts\/(\S+)$/.exec(url)[1];

                ctx.getScriptID(url, function(id) {
                    if (id) {
                        logger.info("Updating " + id + "'s last change time");
                        ctx.db.update(ctx.db.name + '/script', id, {
                            pushed_at: new Date(doc.entries[i].updated)
                        });
                    } else {
                        ctx.createScript(script);
                    }
                });

                i += 1;
            }
        });
    },

    /**
     * Queries a view using the script's github url to retrieve its ID from the db.
     *
     * @param {string} url The script's github url
     * @param {Function} callback The function to execute after querying the view
     */
    getScriptID: function(url, callback) {
        this.db.view(this.db.name + '/by_script_url', { key: url }, function(err, res) {
            callback(res.rows.length > 0 ? res.rows[0].id : null);
        });
    },

    /**
     * Creates a new script record, filled with awesomeness from the github
     * repo API.
     *
     * @param {string} name The name of the script
     */
    createScript: function(name) {
        var ctx = this;

        request({
            uri: 'http://github.com/api/v2/json/repos/show/vim-scripts/' + name
        }, function(err, res, body) {
            var b;

            if (err) throw err;

            if (res.statusCode == 200) {
                b = JSON.parse(body).repository;

                ctx.db.save({
                    name:        b.name,
                    description: b.description,
                    type:        "script",
                    homepage:    b.homepage,
                    url:         b.url,
                    created_at:  b.created_at,
                    pushed_at:   b.pushed_at
                }, function(err, res) {
                    if (err) throw err;
                    logger.info(res);
                });
            }
        });
    }
};

FeedConsumer.prototype.__proto__ = Consumer.prototype;

var ArticleConsumer = exports.ArticleConsumer = function(env) {
    this.env = env;
    this.db;
};

ArticleConsumer.prototype = {
    /**
     * Sets up a CouchDB connection by calling the parent Consumer object.
     *
     * @returns {Object} `this`
     */
    configure: function () {
        this.db = Consumer.prototype.configure.call(this);
        return this;
    },

    /**
     * Tracks _changes and sends an email for each new article that needs to
     * be approved prior to being displayed on the site.
     *
     * @param {Object} options Any options to pass to _changes
     */
    listenForChanges: function(options) {
        var ctx = this;

        Consumer.prototype.listenForChanges.call(this, options, function(change) {
            logger.info("A change occurred: ", change);
            ctx.notify({ "id": change.id, "rev": change.changes[0].rev });
        });
    },

    /**
     * Sends an email notifying that someone submitted a new article
     *
     * @param {Object} docInfo Contains the id and rev of the new article
     */
    notify: function(docInfo) {
        email.send({
            host:     "localhost",
            port:     25,
            domain:   "localhost",
            to:       "me@some-email.com",
            from:     "someone@some-email.com",
            subject:  "New article submitted!",
            template: path.join(__dirname, '../notifier/templates/email.mustache'),
            data:     docInfo
        }, function(err, result) {
            if (err) throw err;
            logger.info("Email sent successfully!");
        });
    }
}

ArticleConsumer.prototype.__proto__ = Consumer.prototype;
