;(function($) {

    var app = $.sammy('body', function() {
        const dbname = 'underground-git';

        this.use('Mustache', 'ms')
            .use('Couch', dbname)
            .use('FormValidator')
            .use('Paginator', 'paginate');

        this.raise_errors = true;
        this.debug = false;

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
                return !/(articles|screencasts|scripts|about)$/.test(document.location.pathname);
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
        app.run('#/');
    });

})(jQuery);
