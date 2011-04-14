(function($, Sammy) {

    Sammy = Sammy || {};

    Sammy.FormValidator = function(app) {
        app.use('Mustache', 'mustache');

        var ms = app.context_prototype.prototype.mustache;

        var FormValidator = {
            MESSAGES: {
                maxlength: "Too long",
                minlength: "Too short",
                required: "This field is required",
                pattern: "Not a valid "
            },

            validateField: function(input) {
                var ctx = this,
                    $input = $(input),
                    attrs = ['required', 'maxlength', 'pattern'];

                if ($input.hasClass('input-error') || !($input.hasClass('input-valid'))) {
                    $.each(attrs, function(index) {
                        if ($input.data('h5-' + attrs[index])) {
                            ctx.Messenger.appendErrorMessage(attrs[index], $input);
                        }
                    });
                } else if ($input.hasClass('input-valid')) {
                    FormValidator.Messenger.hideInputError($input);
                }
            }
        };


        //
        // Logic for displaying and hiding form messages
        //
        FormValidator.Messenger = {
            formMessage: function(form, template, tempData) {
                var ctx = this;
                $(form).find('.submit-error, .submit-success')
                       .remove()
                       .end()
                       .find('input[type=submit]')
                       .after(ms(template, tempData));
            },

            appendErrorMessage: function(attr, $input) {
                var validator = FormValidator,
                    value = $input.val().toLowerCase(),
                    ctx = this;

                switch (attr) {
                case 'maxlength':
                    if (value.length > $input.attr('maxlength')) {
                        ctx.showInputError($input, FormValidator.MESSAGES.maxlength);
                        return false;
                    }
                    break;
                case 'required':
                    if (value.length === 0) {
                        ctx.showInputError($input, FormValidator.MESSAGES.required);
                        return false;
                    }
                    break;
                case 'pattern':
                    if ($input.data('h5-pattern').test(value.toLowerCase()) === false) {
                        if($input.hasClass('h5-minLength')) {
                            ctx.showInputError($input, FormValidator.MESSAGES.minlength);
                        } else if ($input.hasClass('h5-email')) {
                            ctx.showInputError($input, FormValidator.MESSAGES.pattern + 'email');
                        } else {
                            ctx.showInputError($input, FormValidator.MESSAGES.pattern + 'URL');
                        }
                        return false;
                    } else {
                        $input.removeClass('input-error');
                    }
                    break;
                }
            },

            showInputError: function($input, msg) {
                var template = '<div class="error-msg">{{msg}}</div>',
                    result = ms(template, { msg: msg }),
                    ctx = this;

                if ($input.prev('.error-msg').length !== 0) {
                    ctx.hideInputError($input).before(result);
                } else {
                    $input.before(result);
                }
            },

            // Returns $input
            hideInputError: function($input) {
                return $input.prev('.error-msg').remove().end();
            }
        };


        //
        // Handle form submission
        //
        FormValidator.Submitter = {
            processSubmission: function(success, form, template, data) {
                $(form).remove('.submit-error, .submit-success');

                if (success) {
                    FormValidator.Messenger.formMessage(form, template, data);
                    this.clearForm($(form));
                } else {
                    FormValidator.Messenger.formMessage(form, template, data);
                }
            },

            clearForm: function($scope) {
                $scope.find('input:not([type=submit]), textarea').val('');
            }
        };


        this.helpers({
            validate: function(input) {
                FormValidator.validateField(input);
            },

            successfulSubmission: function(form, template, data) {
                FormValidator.Submitter.processSubmission(true, form, template, data);
            },

            unSuccessfulSubmission: function(form, template, data) {
                FormValidator.Submitter.processSubmission(false, form, template, data);
            },

            clearForm: function(form) {
                FormValidator.Submitter.clearForm($(form));
            }
        });
    };

})(jQuery, window.Sammy);

(function($, Sammy) {
    function processResponse(resp, context, ref) {
        context.pagination(ref, { nextKey: resp.key, nextKeyID: resp.id });
    }

    function processResults(resp, options) {
        var results = [],
            ref = options.reference,
            limit = options.limit;

        if (ref.nextIndex) {
            limit += ref.nextIndex - 1;
            results = resp.rows[0].value
                                  .slice(ref.nextIndex, limit);
        } else {
            for(var i=0; i<resp.rows.length; i+=1) {
               results.push(resp.rows[i].value);
            }
        }

       return { rows: results };
    }


    Sammy = Sammy || {};

    Sammy.Paginator = function(app, method_alias) {
        var paginator = function(fun, options) {
            var ctx = this;

            return this.send(fun, options)
                       .then(function(resp) {
                           var next;

                           if (resp.rows.length == options.limit) {
                               next = resp.rows.pop();
                           } else {
                               next = { key: null, id: null };
                           }

                           processResponse(next, ctx, options.reference);

                           return processResults(resp, options);
                       });
        }

        if (!method_alias) method_alias = "paginate";
        app.helper(method_alias, paginator);
    };

})(jQuery, window.Sammy);

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
        this.bind('show-hide-header', function(e, data) {
            var $parent = data["$parent"],
                $menu = data["$menu"],
                endpoint = parseInt( $parent.css('top') ) < 0 ? 0 : -50;

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
            $('#menu-link a', 'header').bind('click', function(e) {
                e.preventDefault();
                ctx.trigger('show-hide-header', {
                    "$parent": $(this).parents('header'),
                    "$menu": $(this)
                });
            });

            // ---- Article Form ----
            ctx.trigger('load-validation', { form: 'form' });

            $('.submit').live('click', function(e) {
                e.preventDefault();

                var $menu = $('#menu-link a');

                $('.overlay').fadeIn('fast');

                if ($(this).parents('header').length > 0) {
                    ctx.trigger('show-hide-header', {
                        "$parent": $menu.parents('header'),
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

Article = Sammy('body').createModel('article');
Article.extend({

    getScreenCastRegex: function () {
        // courtesy of embedly regexp generator
        return /http:\/\/(.*youtube\.com\/watch.*|.*\.youtube\.com\/v\/.*|youtu\.be\/.*|.*\.youtube\.com\/user\/.*|.*\.youtube\.com\/.*#.*\/.*|m\.youtube\.com\/watch.*|m\.youtube\.com\/index.*|.*\.youtube\.com\/profile.*|.*justin\.tv\/.*|.*justin\.tv\/.*\/b\/.*|.*justin\.tv\/.*\/w\/.*|www\.ustream\.tv\/recorded\/.*|www\.ustream\.tv\/channel\/.*|www\.ustream\.tv\/.*|qik\.com\/video\/.*|qik\.com\/.*|qik\.ly\/.*|.*revision3\.com\/.*|.*\.dailymotion\.com\/video\/.*|.*\.dailymotion\.com\/.*\/video\/.*|www\.collegehumor\.com\/video:.*|.*twitvid\.com\/.*|www\.break\.com\/.*\/.*|vids\.myspace\.com\/index\.cfm\?fuseaction=vids\.individual&videoid.*|www\.myspace\.com\/index\.cfm\?fuseaction=.*&videoid.*|www\.metacafe\.com\/watch\/.*|www\.metacafe\.com\/w\/.*|blip\.tv\/file\/.*|.*\.blip\.tv\/file\/.*|video\.google\.com\/videoplay\?.*|.*revver\.com\/video\/.*|video\.yahoo\.com\/watch\/.*\/.*|video\.yahoo\.com\/network\/.*|.*viddler\.com\/explore\/.*\/videos\/.*|liveleak\.com\/view\?.*|www\.liveleak\.com\/view\?.*|animoto\.com\/play\/.*|dotsub\.com\/view\/.*|www\.overstream\.net\/view\.php\?oid=.*|www\.livestream\.com\/.*|www\.worldstarhiphop\.com\/videos\/video.*\.php\?v=.*|worldstarhiphop\.com\/videos\/video.*\.php\?v=.*|teachertube\.com\/viewVideo\.php.*|www\.teachertube\.com\/viewVideo\.php.*|www1\.teachertube\.com\/viewVideo\.php.*|www2\.teachertube\.com\/viewVideo\.php.*|bambuser\.com\/v\/.*|bambuser\.com\/channel\/.*|bambuser\.com\/channel\/.*\/broadcast\/.*|www\.schooltube\.com\/video\/.*\/.*|bigthink\.com\/ideas\/.*|bigthink\.com\/series\/.*|sendables\.jibjab\.com\/view\/.*|sendables\.jibjab\.com\/originals\/.*|www\.xtranormal\.com\/watch\/.*|dipdive\.com\/media\/.*|dipdive\.com\/member\/.*\/media\/.*|dipdive\.com\/v\/.*|.*\.dipdive\.com\/media\/.*|.*\.dipdive\.com\/v\/.*|www\.whitehouse\.gov\/photos-and-video\/video\/.*|www\.whitehouse\.gov\/video\/.*|wh\.gov\/photos-and-video\/video\/.*|wh\.gov\/video\/.*|www\.hulu\.com\/watch.*|www\.hulu\.com\/w\/.*|hulu\.com\/watch.*|hulu\.com\/w\/.*|.*crackle\.com\/c\/.*|www\.fancast\.com\/.*\/videos|www\.funnyordie\.com\/videos\/.*|www\.funnyordie\.com\/m\/.*|funnyordie\.com\/videos\/.*|funnyordie\.com\/m\/.*|www\.vimeo\.com\/groups\/.*\/videos\/.*|www\.vimeo\.com\/.*|vimeo\.com\/m\/#\/featured\/.*|vimeo\.com\/groups\/.*\/videos\/.*|vimeo\.com\/.*|vimeo\.com\/m\/#\/featured\/.*|www\.ted\.com\/talks\/.*\.html.*|www\.ted\.com\/talks\/lang\/.*\/.*\.html.*|www\.ted\.com\/index\.php\/talks\/.*\.html.*|www\.ted\.com\/index\.php\/talks\/lang\/.*\/.*\.html.*|.*nfb\.ca\/film\/.*|www\.thedailyshow\.com\/watch\/.*|www\.thedailyshow\.com\/full-episodes\/.*|www\.thedailyshow\.com\/collection\/.*\/.*\/.*|movies\.yahoo\.com\/movie\/.*\/video\/.*|movies\.yahoo\.com\/movie\/.*\/trailer|movies\.yahoo\.com\/movie\/.*\/video|www\.colbertnation\.com\/the-colbert-report-collections\/.*|www\.colbertnation\.com\/full-episodes\/.*|www\.colbertnation\.com\/the-colbert-report-videos\/.*|www\.comedycentral\.com\/videos\/index\.jhtml\?.*|www\.theonion\.com\/video\/.*|theonion\.com\/video\/.*|wordpress\.tv\/.*\/.*\/.*\/.*\/|www\.traileraddict\.com\/trailer\/.*|www\.traileraddict\.com\/clip\/.*|www\.traileraddict\.com\/poster\/.*|www\.escapistmagazine\.com\/videos\/.*|www\.trailerspy\.com\/trailer\/.*\/.*|www\.trailerspy\.com\/trailer\/.*|www\.trailerspy\.com\/view_video\.php.*|www\.atom\.com\/.*\/.*\/|fora\.tv\/.*\/.*\/.*\/.*|www\.spike\.com\/video\/.*|www\.gametrailers\.com\/video\/.*|gametrailers\.com\/video\/.*|www\.koldcast\.tv\/video\/.*|www\.koldcast\.tv\/#video:.*|techcrunch\.tv\/watch.*|techcrunch\.tv\/.*\/watch.*|mixergy\.com\/.*|video\.pbs\.org\/video\/.*|www\.zapiks\.com\/.*|tv\.digg\.com\/diggnation\/.*|tv\.digg\.com\/diggreel\/.*|tv\.digg\.com\/diggdialogg\/.*|www\.trutv\.com\/video\/.*|www\.nzonscreen\.com\/title\/.*|nzonscreen\.com\/title\/.*|app\.wistia\.com\/embed\/medias\/.*|https:\/\/app\.wistia\.com\/embed\/medias\/.*|www\.godtube\.com\/featured\/video\/.*|godtube\.com\/featured\/video\/.*|www\.godtube\.com\/watch\/.*|godtube\.com\/watch\/.*|www\.tangle\.com\/view_video.*|mediamatters\.org\/mmtv\/.*|www\.clikthrough\.com\/theater\/video\/.*|espn\.go\.com\/video\/clip.*|espn\.go\.com\/.*\/story.*|abcnews\.com\/.*\/video\/.*|abcnews\.com\/video\/playerIndex.*|washingtonpost\.com\/wp-dyn\/.*\/video\/.*\/.*\/.*\/.*|www\.washingtonpost\.com\/wp-dyn\/.*\/video\/.*\/.*\/.*\/.*|www\.boston\.com\/video.*|boston\.com\/video.*|www\.facebook\.com\/photo\.php.*|www\.facebook\.com\/video\/video\.php.*|www\.facebook\.com\/v\/.*|cnbc\.com\/id\/.*\?.*video.*|www\.cnbc\.com\/id\/.*\?.*video.*|cnbc\.com\/id\/.*\/play\/1\/video\/.*|www\.cnbc\.com\/id\/.*\/play\/1\/video\/.*|cbsnews\.com\/video\/watch\/.*|www\.google\.com\/buzz\/.*\/.*\/.*|www\.google\.com\/buzz\/.*|www\.google\.com\/profiles\/.*|google\.com\/buzz\/.*\/.*\/.*|google\.com\/buzz\/.*|google\.com\/profiles\/.*|www\.cnn\.com\/video\/.*|edition\.cnn\.com\/video\/.*|money\.cnn\.com\/video\/.*|today\.msnbc\.msn\.com\/id\/.*\/vp\/.*|www\.msnbc\.msn\.com\/id\/.*\/vp\/.*|www\.msnbc\.msn\.com\/id\/.*\/ns\/.*|today\.msnbc\.msn\.com\/id\/.*\/ns\/.*|multimedia\.foxsports\.com\/m\/video\/.*\/.*|msn\.foxsports\.com\/video.*|www\.globalpost\.com\/video\/.*|www\.globalpost\.com\/dispatch\/.*)/i;
    },

    isScreencast: function(url) {
        var regex = Article.getScreenCastRegex();
        return regex.test(url);
    },

    processNewDoc: function(params, form) {
        var ctx = Sammy('body'),
            newDoc = {};

        if (params.lol1 || params.lol2) {
            throw new Error("Looks like you're a bot. Epic fail.");
        }

        for (key in params) {
            if (!/^lol\d$/.test(key)) {
                newDoc[key] = params[key];
            }
        }

        newDoc.posted_on = Date();
        newDoc.approved = false;

        if (Article.isScreencast(params.link)) {
            $.embedly(params.link, {
                urlRe:   Article.getScreenCastRegex(),
                success: function(oembed, dict) {
                    newDoc.html           = oembed.html;
                    newDoc.thumb_url      = oembed.thumbnail_url;
                    newDoc.author         = oembed.author;
                    newDoc.author_website = oembed.author_website;
                    newDoc.type           = "screencast";
                    ctx.trigger('add-article', { doc: newDoc, target: form });
                }
            });
        } else {
            newDoc.type = "article";
            ctx.trigger('add-article', { doc: newDoc, target: form });
        }
    },

    beforeSave: function(doc) {
        if (!doc._id) {
            if (!/^https?:\/\//.test(doc.link))
                doc.link = 'http://' + doc.link;
            doc._id = doc.link;
            delete doc.link;
        }
        return doc;
    }
});

