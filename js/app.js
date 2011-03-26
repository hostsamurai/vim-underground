;(function($) {

    var app = $.sammy('body', function() {
        this.use('Handlebars', 'hb')
            .use('Couch')
            .use('FormValidator')
            .use('Paginator', 'paginate');

        this.raise_errors = true;

        // Initialize storage
        //this.store('pagination');

        // Helpers
        this.helpers({
            fancyDates: function () {
                var ctx = this;

                $('.fancy-time').each(function(i, val) {
                    var date = new Date($(this).attr('datetime')),
                        day = date.strftime('%d'),
                        mnt_yr = date.strftime('%m.%y'),
                        template = '<span class="day">{{day}}</span> {{mnt_yr}}';

                    $(this).html(ctx.hb(template, { day: day, mnt_yr: mnt_yr }));
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

            loadBlurbs: function(view, sel, options) {
                var db = this.db.name,
                    defaults = {
                        descending: true,
                        success: function(json) {
                            $(sel).append(json.body);
                        }
                    };

                $.extend(options, defaults);
                $.couch.db(db).list(db + '/blurbs', view, options);
            }
        });


        this.before('#/', function() {

        });

        // Routes
        this.get('#/', function () {
            var ctx = this,
                db = this.db.name;

            // load scripts on the homepage
            ctx.loadBlurbs('script_fragment', '#scripts', {
                limit: 9,
                rows: 3,
                cols: 3,
                heading: 'Latest Script Activity'
            });

            // load screencasts on the homepage
            ctx.loadBlurbs('latest_screencasts', '#screencasts', {
                limit: 6,
                rows: 3,
                cols: 2,
                heading: 'Latest Screencasts'
            });
        });

        this.post('#/new', function () {

        });

        this.post('#/contact', function () {
            this.trigger('email', { params: this.params, form: this.target });
        });


        // Custom Events
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
                    $(form).find('input[type=submit]').after(ctx.hb(template, {}));
                }
            });
        });

        this.bind('show-help', function(e, data) {
            if (!$('.overlay').is(':visible')) {
                this.render('templates/help/help.hb')
                    .appendTo('.overlay')
                    .then(function () {
                        $('.overlay').toggle();
                    });
            }
        });

        this.bind('close-popup', function(e, data) {
            var $elem = data['$this'];

            $elem.parents('.overlay').toggle();

            if ($elem.parents('#help').length !== 0) {
                $('#help').remove();
            } else if ($elem.parents('.abs-form-container').length !== 0) {
                $('.abs-form-container').remove();
            }
        });

        this.bind('show-form', function(e, data) {
            var $overlay = data["$overlay"],
                $form = data["$form"],
                $this = data["$this"],
                template,
                append_class,
                ctx = this;

            if (!$overlay.is(':visible')) {
                $overlay.toggle();

                if ($form.length === 0) {
                    append_class = ".overlay";

                    if ($this.is(':nth-child(2)')) {
                        template = 'templates/forms/article.hb';
                    } else if ($this.is(':last-child')) {
                        template = 'templates/forms/contact.hb';
                    }

                } else {
                    append_class = ".abs-form-container";

                    if ($this.is(':first-child') && $form.attr('id') === "contact") {
                        $form.remove();
                        template = 'templates/forms/article.hb';
                    } else if ($this.is(':last-child') && $form.attr('id') === "new-article") {
                        $form.remove();
                        template = 'templates/forms/contact.hb';
                    }
                }

                if (template) {
                    ctx.render(template)
                       .appendTo(append_class)
                       .trigger('load-validation', { form: '.overlay form' });
                }
            }
        });

        this.bind('load-validation', function(e, data) {
            var $form = $(data.form);

            $.h5Validate.addPatterns({
                minLength: /^(\w.*){5,}$/,
                url: /(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/
            });

            $form.h5Validate({ errorClass: 'input-error', validClass: 'input-valid', debug: false })
                 .bind('submit', function(e) {
                     e.preventDefault();
                 });
        });

        this.bind('run', function() {
            var ctx = this;


            // ---- Form validation bindings ----
            ctx.trigger('load-validation', { form: 'form' });

            $('#extra > a:nth(1), #extra > a:last').live('click', function(e) {
                e.preventDefault();
                ctx.trigger('show-form', { "$overlay": $('.overlay'),
                                           "$form": $('.overlay').find('form'),
                                           "$this": $(this) });
            });

            $('input:not([type=submit]), textarea', $(this).parent('form')[0])
                .live('focusout keydown', function(e) {
                    ctx.validate(this);
            });

            $('.abs-form a, #help a').live('click', function(e) {
                e.preventDefault();
                ctx.trigger('close-popup', { '$this': $(this) });
            });


            // ---- Help pop-up ----
            $('#extra > a:first').live('click', function(e) {
                e.preventDefault();
                ctx.trigger('show-help');
            });
        });
    });


    $(function() {
        app.run('#/');
    });

})(jQuery);
