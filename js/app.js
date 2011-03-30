;(function($) {

    var app = $.sammy('body', function() {
        this.use('Mustache', 'ms')
            .use('Couch')
            .use('FormValidator')
            .use('Paginator', 'paginate');

        this.raise_errors = true;

        // Helpers
        this.helpers({
            fancyDates: function () {
                var ctx = this;

                $('.fancy-time').each(function(i, val) {
                    var date = new Date($(this).attr('datetime')),
                        day = date.strftime('%d'),
                        mnt_yr = date.strftime('%m.%y'),
                        template = '<span class="day">{{day}}</span> {{mnt_yr}}';

                    $(this).html(ctx.ms(template, { day: day, mnt_yr: mnt_yr }));
                });
            },

            prettyDates: function () {
                $('time:not(.fancy-time)').timeago();
            },

            //
            // Returns a random row value out of a couchDB response array
            //
            chooseAtRandom: function(results) {
                var i = Math.floor(Math.random() * 25);
                return results.rows[i].value;
            },

            onHomepage: function () {
                return !/(articles|screencasts|scripts)$/.test(document.location.pathname);
            },

            /**
             *  Load blurbs from a couchdb list and update the data attribute
             *  in $('.container') for pagination purposes.
             *
             *  @param {String} view The name of the view to access from the list
             *
             *  @param {String} sel A jQuery selector acting as the container for the results
             *
             *  @param {Object} options Additional options to pass to the list function
             *
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

                return this;
            }
        });


        // Routes
        this.get('#!/', function () {
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

        this.post('#/new', function(ctx) {
            var form = ctx.target,
                data = ctx.params,
                template = '<div class="{{submitClass}} hyphenate">{{msg}}</div>',
                msg,
                doc;

            // check params
            if (data.lol1 || data.lol2) {
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
            }

            /*
             * TODO: create doc obj
             *       check whether a new doc is an article or screencast
             *       upload to couchdb
             *
             */
        });


        // Custom Events
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
                record = data.record;

            Article.save(record, {
                success: function () {
                    var template = '<div class="submit-success">{{model}} successfully created!</div>',
                        model = record.type;

                    // trigger this instead
                    ctx.successfulSubmission(form, template, { model: model });
                },
                error: function (e, resp, reason) {
                    var template = '<div class="submit-error">{{msg}}</div>',
                        model = record.type;

                    if (/Document update conflict/.test(reason)) {
                        msg = "An article or screencast already exists with that name! " +
                              "Please make sure that your submission hasn't already been published " +
                              "on this site.";
                    } else {
                        msg = record.type + " not created! Please make sure all form fields are " +
                              "filled out and valid and try again. If the problem persists, feel " +
                              "free to contact me.";
                    }

                    // trigger this instead
                    ctx.unSuccessfulSubmission(form, template, { msg: msg });
                }
            });
        });

        this.bind('email', function(e, data) {
            var ctx = this,
                form = data.form,
                params = {
                    name: data.params.name,
                    email: data.params.email,
                    message: data.params.message
                };

            if (data.params.lol1 || data.params.lol2) {
                throw new Error("Looks like you're a bot. Epic fail.");
            }

            $.ajax({
                type: 'POST',
                url: 'http://localhost:5984/underground/_emailer',
                data: params,
                dataType: 'json',
                success: function(json) {
                    // TODO: implement me
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    var error = $.parseJSON(XMLHttpRequest.responseText),
                        template = '<div class="submit-error">Sorry, but your email could not be sent. You can try again or use your <a href="mailto:your@email.com">email client</a> to send the message.</div>';
                    $(form).find('input[type=submit]').after(ctx.ms(template, {}));
                }
            });
        });

        this.bind('load-validation', function(e, data) {
            var ctx = this,
                $form = $(data.form);

            $.h5Validate.addPatterns({
                minLength: /^(\w.*){5,}$/,
                url: /(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/
            });

            $form.h5Validate({
                kbSelectors: '[name=title], [type=url], textarea',
                keyup: true,
                errorClass: 'input-error',
                validClass: 'input-valid',
                debug: false
            }).bind('submit', function(e) { e.preventDefault(); });
        });

        this.bind('run', function () {
            var ctx = this;

            // Hyphenation
            var hyphenatorSettings = {
                enableCache: true,
                onhyphenationdonecallback: function () {
                    // Prevent re-hyphenating hyphenated results when paginating
                    $('.hyphenate').removeClass('hyphenate');
                }
            }

            // ---- Menu Links ----
            $('#menu-link a', 'header').bind('click', function(e) {
                e.preventDefault();

                var $parent = $(this).parents('header'),
                    $menu = $(this),
                    endpoint = parseInt( $parent.css('top') ) < 0 ? 0 : -50;

                $parent.animate({ top: endpoint }, "fast", function () {
                    if ($menu.hasClass('up')) {
                        $menu.removeClass('up').addClass('down');
                    } else if ($menu.hasClass('down')) {
                        $menu.removeClass('down').addClass('up');
                    }
                });
            });

            // ---- Article Form ----
            ctx.trigger('load-validation', { form: 'form' });

            $('.submit').live('click', function(e) {
                e.preventDefault();
                $('.overlay').fadeIn('fast');
            });

            $('input:not([type=submit]), textarea', $(this).parent('form')[0])
                .live('focusout keydown', function(e) {
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
        app.run('#!/');
    });

})(jQuery);
