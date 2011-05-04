;(function($) {

    var app = $.sammy('body', function() {
        var dbname = 'underground-git';

        this.use('Mustache', 'ms')
            .use('Couch', dbname)
            .use('FormValidator')
            .use('Paginator', 'paginate');

        this.raise_errors = true;
        this.debug = false;

        // Helpers
        this.helpers({
            markNew: function(selectors) {
                var curTime = new Date(),
                    minDate = new Date(Date.UTC(curTime.getUTCFullYear(),
                                                curTime.getUTCMonth(),
                                                curTime.getUTCDate() - 3)).getTime(),
                    date,
                    $sel;

                $.each(selectors, function(i, val) {
                    $sel = $(val);

                    if ($sel.length > 0) {
                        $sel.find('.blurb').each(function(j,v) {
                            date = new Date($(this).find('date').attr('datetime')).getTime();

                            if (date > minDate) $(this).append('<div class="new"></div>');
                            else return;
                        });
                    }
                });
            },

            toISODate: function(d) {
                // taken from:
                // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date
                function pad(n) { return n < 10 ? '0' + n : n };

                return d.getUTCFullYear() + '-'
                     + pad(d.getUTCMonth() + 1) + '-'
                     + pad(d.getUTCDate()) + 'T'
                     + pad(d.getUTCHours()) + ':'
                     + pad(d.getUTCMinutes()) + ':'
                     + pad(d.getUTCSeconds()) + 'Z';
            },

            hideLoader: function(sel) {
                $(sel).find('.loader').remove();
                return this;
            },

            onHomepage: function () {
                return !/(articles|screencasts|scripts|about)$/.test(document.location.pathname);
            },

            filterResults: function(results) {
                var ctx = this,
                    filtered = [];

                for (var i = 0; i < results.length; i++) {
                    var blurb = results[i]._source;

                    filtered.push({
                        title: blurb.title || blurb.name,
                        type: blurb.type,
                        desc: blurb.summary || blurb.description,
                        link: /article|screencast/.test(blurb.type) ?
                                blurb._id : blurb.url,
                        short_date: /article|screencast/.test(blurb.type) ?
                            blurb.posted_on.substr(0,10).replace(/-|\//g, '.') :
                            blurb.pushed_at.substr(0,10).replace(/-|\//g, '.')
                    });
                };

                return filtered;
            },

            getQueryTypes: function(params) {
                return [
                    params.articles,
                    params.screencasts,
                    params.scripts
                ].filter(function(elem) {
                    if (elem !== null) return elem;
                }).map(function(elem) {
                    return elem.toLowerCase();
                });
            },

            getQueryFields: function(params) {
                return (params.articles || params.screencasts ?
                            ["title^2", "summary"] : []
                          ).concat( (params.scripts ?
                            ["name^2", "description"] : []) );
            },

            /**
             * Creates the query that we send to elasticsearch.
             *
             * @param {Array} fields A list of document attributes to apply the search
             * @param {String} query The term to search for
             * @param {Array} types Search all articles and/or screencasts and/or scripts
             * @returns {Object} The query object to send to elasticsearch
             */
            formatQuery: function(fields, query, types) {
                return {
                    "from": 0, "size": 100,
                    "sort": [
                        { "posted_on": { "order": "desc" } },
                        "_score"
                    ],
                    "query": {
                        "filtered": {
                            "query": {
                                "query_string": {
                                    "fields": fields,
                                    "query": query,
                                    "fuzzy_prefix_length": 2,
                                    "phrase_slop": 2,
                                    "use_dis_max": true
                                }
                            },
                            "filter": {
                                "terms": { "type": types }
                            }
                        }
                    }
                };
            },

            /**
             *  Load blurbs from a couchdb list and update the data attribute
             *  in $('.container') for pagination purposes.
             *
             *  @param {String} view The name of the view to access from the list
             *  @param {String} sel A jQuery selector acting as the container for the results
             *  @param {Object} options Additional options to pass to the list function
             *  @returns {Object} Sammy.EventContext
             */
            loadBlurbs: function(view, sel, options) {
                var ctx = this,
                    db = this.db.name,
                    defaults = {
                        descending: true,
                        type: sel.replace(/^\.|#/g, ''),
                        success: function(json) {
                            $(sel).append(json.body)
                                  .data('last-key', json.key);

                            // Hyphenate new blurbs
                            Hyphenator.run();
                        }
                    };

                $.extend(options, defaults);
                $.couch.db(db).list(db + '/blurbs', view, options);

                ctx.hideLoader(sel);

                return this;
            },

            validateInputs: function(params, form, callback) {
                var ctx = this,
                    template = '<p class="{{submitClass}} hyphenate">{{msg}}</p>',
                    form,
                    msg;

                if (params.lol1 || params.lol2) {
                    throw new Error("Nice try.");
                }

                if ($('.input-valid').length < 3) {
                    $.each(['.h5-url', '.h5-minLength', 'textarea'], function(i,val) {
                        ctx.validate(val);
                    });

                    msg = {
                        msg: "Sorry, your submission didn't go through. Make sure you " +
                             "have filled in all inputs correctly and try again.",
                        submitClass: 'submit-error'
                    };

                    ctx.unSuccessfulSubmission(form, template, msg);
                    return;
                } else {
                    callback();
                }
            }
        });


        // Routes
        this.after(function () {
            this.markNew(['#articles', '#screencasts', '#t-screencasts',
                          '#scripts', '#t-scripts', '#by-rating']);
        }),

        this.get('#/', function () {
            var ctx = this,
                db = this.db.name;

            // load scripts and screencasts on the homepage
            if (ctx.onHomepage()) {
                ctx.loadBlurbs('script_fragment', '#scripts', {
                    limit: 12,
                    rows: 4,
                    cols: 3,
                    heading: 'Latest Script Activity'
                });

                ctx.loadBlurbs('latest_screencasts', '#screencasts', {
                    limit: 6,
                    rows: 3,
                    cols: 2,
                    trlen: 28,
                    heading: 'Latest Screencasts'
                });
            }

            // load scripts by rating on scripts page
            if (/scripts$/.test(document.location.pathname)) {
                ctx.loadBlurbs('by_rating', '#by-rating', {
                    limit: 14,
                    rows: 7,
                    cols: 2,
                    heading: 'Popular Scripts'
                });
            }
        });

        this.post('#/search', function(ctx) {
            var $menu = $('header .wrapper:last .menu-link a'),
                types = ctx.getQueryTypes(ctx.params),
                fields = ctx.getQueryFields(ctx.params),
                query = ctx.formatQuery(fields, ctx.params.search, types);

            var data = {
                "index": ctx.db.name,
                "query": query
            };

            $.post('/search', JSON.stringify(data), function(data) {
                var results = ctx.filterResults(JSON.parse(data.body).hits.hits),
                stash = {
                    search: ctx.params.search,
                    results: {
                        blurbs: results
                    }
                };

                ctx.render('search.mustache', stash)
                    .replace('.content')
                    .trigger('show-hide-header', {
                        "$parent": $menu.parents('header .wrapper'),
                        "$menu": $menu
                    });
            }, 'json');
        });

        this.post('#/new', function(ctx) {
            ctx.validateInputs(ctx.params, ctx.target, function () {
                ctx.send(Article.processNewDoc, ctx.params, ctx.target);
            });
        });

        this.post('#/contact', function(ctx) {
            var form = ctx.target,
                params = {
                    sender: ctx.params.name,
                    email: ctx.params.email,
                    subject: "Vim Underground Inquiry",
                    message: ctx.params.message
                },
                template = '<p class="{{klass}}">{{{msg}}}</p>',
                msg;

            $.ajax({
                type: 'POST',
                url: '/mail',
                data: params,
                dataType: 'json',
                success: function(resp) {
                    msg = "Message sent! Thank you for your inquiry!";
                    ctx.successfulSubmission(form, template, { klass: "submit-success", msg: msg });
                },
                error: function(request, textStatus, errorThrown) {
                    msg = 'Sorry, but your email could not be sent. You can try again ' +
                          'or use your <a href="mailto:your@email.com">email client</a> ' +
                          'to send the message.';

                    ctx.unSuccessfulSubmission(form, template, { klass: "submit-error", msg: msg });
                }
            });
        });


        // Custom Events
        this.bind('show-hide-header', function(e, data) {
            var $parent = data["$parent"],
                $menu = data["$menu"],
                endpoint = parseInt( $parent.css('top') ) < 0 ? 0 : $parent.height() * -1 + 20;

            $parent.animate({ top: endpoint }, "fast", function () {
                if ($menu.hasClass('up')) {
                    $menu.removeClass('up').addClass('down');
                } else if ($menu.hasClass('down')) {
                    $menu.removeClass('down').addClass('up');
                }
            });
        });

        this.bind('show-more', function(e, data) {
            var ctx = this,
                $parent = data.parent,
                sel = data.selector,
                options = data.options,
                view = options.view,
                lastKey = $parent.data('last-key'),
                settings = {
                    limit: options.limit || 15,
                    rows: options.rows || 3,
                    cols: options.cols || 5,
                    startkey: typeof lastKey === "string" ? lastKey.split(',', 2) : lastKey,
                    skip: 1
                };

            ctx.loadBlurbs(view, sel, settings);
        });

        this.bind('add-article', function(e, data) {
            var ctx = this,
                form = data.target,
                doc = data.doc,
                model = doc.type,
                template = '<p class="{{klass}}">{{msg}}</p>',
                msg;

            doc.posted_on = ctx.toISODate(new Date());

            Article.save(doc, {
                success: function () {
                    msg = model.capitalize() + " successfully submitted! It will appear alongside " +
                          "other " + model.pluralize() + " after being reviewed.";

                    ctx.successfulSubmission(form, template, { klass: "submit-success", msg: msg });
                },
                error: function (e, resp, reason) {
                    if (/Document update conflict/.test(reason)) {
                        var indefArt = model === "article" ? "An " : "A ";
                        msg = indefArt + model + " with the same URL already exists.";
                    } else {
                        msg = model.capitalize() + " not created! Please make sure you have" +
                              "filled out all input fields and that they're valid before " +
                              "trying again. If the problem persists, feel free to contact me.";
                    }

                    ctx.unSuccessfulSubmission(form, template, { klass: "submit-error", msg: msg });
                }
            });
        });

        this.bind('load-validation', function(e, data) {
            var ctx = this,
                $form = $(data.form),
                // shamelessly stolen from dojox:
                // https://github.com/dojo/dojox/blob/master/validate/regexp.js
                protocolRE = "(https?|ftps?)\\://",
                domainLabelRE = "(?:[\\da-zA-Z](?:[-\\da-zA-Z]{0,61}[\\da-zA-Z])?)",
                domainNameRE = "(?:[a-zA-Z](?:[-\\da-zA-Z]{0,6}[\\da-zA-Z])?)",
                portRE = "(\\:\\d+)?",
                hostnameRE = "((?:" + domainLabelRE + "\\.)+" + domainNameRE + "\\.?)",
                pathRE = "(/(?:[^?#\\s/]+/)*(?:[^?#\\s/]+(?:\\?[^?#\\s/]*)?(?:#[A-Za-z][\\w.:-]*)?)?)?",
                urlRE = protocolRE + "(" + hostnameRE + ")" + portRE + pathRE;

            $.h5Validate.addPatterns({
                minLength: /^(\w.*){5,}$/,
                url: new RegExp(urlRE)
            });

            $form.h5Validate({
                kbSelectors: '[name=title], [type=url], [type=email], [name=name], textarea',
                keyup: true,
                errorClass: 'input-error',
                validClass: 'input-valid',
                debug: false
            }).bind('submit', function(e) { e.preventDefault(); });
        });

        this.bind('run', function () {
            var ctx = this;


            // ---- Menu Links ----
            $('.menu-link a', 'header').bind('click', function(e) {
                e.preventDefault();
                ctx.trigger('show-hide-header', {
                    "$parent": $(this).parents('header .wrapper'),
                    "$menu": $(this)
                });
            });

            // ---- Article Form ----
            ctx.trigger('load-validation', { form: 'form' });

            $('.submit').live('click', function(e) {
                e.preventDefault();

                var $menu = $(this).parents('.wrapper').find('.menu-link a');

                $('.overlay').fadeIn('fast');

                // hide menu after clicking on 'submit'
                if ($(this).parents('header .wrapper').length > 0) {
                    ctx.trigger('show-hide-header', {
                        "$parent": $menu.parents('header .wrapper'),
                        "$menu": $menu
                    });
                }
            });

            $('input:not([type=submit]), textarea', $(this).parent('form')[0])
                .live('keydown', function(e) {
                    ctx.validate(this);
            });

            $('.close').live('click', function(e) {
                e.preventDefault();
                $('.overlay').fadeOut('fast');
            });

            // ---- Show More links ----
            $('.more').live('click', function(e) {
                if (!ctx.onHomepage()) {
                    e.preventDefault();

                    var $parent = $(this).parent('section'),
                        selector,
                        match,
                        view,
                        options;

                    selector = '#' + $parent.attr('id');
                    mappings = {
                        "articles":      { view: 'latest_articles' },
                        "t-screencasts": { view: 'latest_screencasts' },
                        "t-scripts":     { view: 'script_fragment', limit: 21, rows: 7, cols: 3 },
                        "by-rating":     { view: 'by_rating', limit: 14, rows: 7, cols: 2 }
                    };

                    options = mappings[selector.replace('#', '')];

                    $(this).remove();
                    // TODO: show loading gif

                    ctx.trigger('show-more', {
                        parent:   $parent,
                        selector: selector,
                        view:     view,
                        options:  options
                    });
                }
            });
        });
    });


    $(function() {
        app.run('#/');
    });

})(jQuery);
