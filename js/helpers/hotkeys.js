(function($, Sammy) {

    var Hotkeys = {};

    Hotkeys.VimlikeKeys = {
        X_SCROLL: $(window).height() * 0.15,
        Y_SCROLL: $(window).width() * 0.15,

        bindVerticalScroll: function(key, amount) {
            $(document).bind('keyup', key, function () {
                var pos = $(this).scrollTop() + amount;

                $(this).scrollTop(pos);
            });
        },

        scrollUp: function(key) {
            this.bindVerticalScroll(key, this.Y_SCROLL * -1);
        },

        scrollDown: function(key) {
            this.bindVerticalScroll(key, this.Y_SCROLL);
        },

        bindHorizontalScroll: function(key, amount) {
            $(document).bind('keyup', key, function () {
                var pos = $(this).scrollLeft() + amount;

                $(this).scrollLeft(pos);
            });
        },

        scrollLeft: function(key) {
            this.bindHorizontalScroll(key, this.X_SCROLL * -1);
        },

        scrollRight: function(key) {
            this.bindHorizontalScroll(key, this.X_SCROLL);
        },

        scrollToEndPoint: function(key, amount, horizontal) {
            $(document).bind('keyup', key, function () {
                if (horizontal) {
                    $(this).scrollLeft(amount);
                } else {
                    $(this).scrollTop(amount);
                }
            });
        },

        scrollToEnd: function(key) {
            this.scrollToEndPoint(key, $(document).width(), true);
        },

        scrollToStart: function(key) {
            this.scrollToEndPoint(key, 0, true);
        },

        scrollToPageTop: function(key) {
            this.scrollToEndPoint(key, 0);
        },

        scrollToPageBottom: function(key) {
            this.scrollToEndPoint(key, $(document).height());
        },

        scrollToNextSection: function(key) {
            $(document).bind('keyup', key, function () {
                var next = $('.container:in-viewport').next().offset().left;
                $(this).scrollLeft(next);
            });
        },

        scrollToPrevSection: function(key) {
            $(document).bind('keyup', key, function () {
                var prev = $('.container:in-viewport').prev().offset().left;
                $(this).scrollLeft(prev);
            });
        },

        bind: function(keys) {
            // Navigation
            //
            // j - Scroll down
            // k - Scroll up
            // l - Scroll right
            // h - Scroll left
            this.scrollUp(keys.up);
            this.scrollDown(keys.down);
            this.scrollLeft(keys.left);
            this.scrollRight(keys.right);

            // $  - Scroll to leftmost part of page (feeds)
            // ^  - Scroll to rightmost part of page (articles)
            this.scrollToEnd(keys.end);
            this.scrollToStart(keys.start);

            // shift + j - Scroll to bottom of page
            // shift + k - Scroll to top of page
            this.scrollToPageTop(keys.top);
            this.scrollToPageBottom(keys.bottom);

            // shift + l - scroll to next section if any
            // shift + h - scroll to previous section if any
            this.scrollToNextSection(keys.next);
            this.scrollToPrevSection(keys.prev);
        }
    }

    // Keys for submitting a new article or sending an email
    //
    // :w - Submit a new article - trigger show-form
    // ,c - submit an email
    // :q - close the current form
    Hotkeys.FormKeys = {
        bindFormKeys: function(key, link, ctx) {
            $(document).bind('keyup', key, function () {
                ctx.trigger('show-form', { "$overlay": $('.overlay'),
                                           "$form":    $('.overlay').find('form'),
                                           "$this":    $(link) });
            });
        },

        bindSubmitForm: function(key, link, context) {
            this.bindFormKeys(key, link, context);
        },

        bindContactForm: function(key, link, context) {
            this.bindFormKeys(key, link, context);
        },

        bindCloseForm: function(key, context) {
            $(document).bind('keyup', key, function () {
                var $elems = $('.overlay .close');

                if ($elems.is(':visible')) {
                    context.trigger('close-popup', { '$this': $elems });
                }
            });
        },

        bind: function(keys) {
            this.bindSubmitForm(keys.submit.combo, keys.submit.link, keys.context);
            this.bindContactForm(keys.contact.combo, keys.contact.link, keys.context);
            this.bindCloseForm(keys.close, keys.context);
        }
    }

    // Other navigation
    //
    // a - go to articles
    // s - go to screencasts
    // d - go to scripts
    Hotkeys.OtherKeys = {
        bindToElem: function(id, key) {
            $(document).bind('keyup', key, function(e) {
                var pos = $('#' + id).offset().left;
                $(this).scrollLeft(pos);
            });
        },

        bindHelp: function(key, context) {
            $(document).bind('keyup', key, function () {
                context.trigger('show-help');
            });
        },

        bind: function(keys) {
            for (var key in keys.nav) {
                this.bindToElem(key, keys.nav[key]);
            }

            this.bindHelp(keys.help, keys.context);
        }
    }

    Sammy = Sammy || {};

    Sammy.Hotkeys = function(app, method_alias) {
        var ctx = this,
            vim_keys = { up: 'k', down: 'j', left: 'h', right: 'l',
                         end: '$', start: '^', bottom: 'shift+g', top: 'shift+k',
                         prev: 'shift+h', next: 'shift+l' },

            form_keys = {
                submit:  { combo: ': w', link: '#extra > a:nth(1)' },
                contact: { combo: ', c', link: '#extra > a:last' },
                close:   ': q',
                context: ctx
            },

            other_keys = {
                nav: { 'articles': 'a',
                       'screencasts': 's',
                       'scripts': 'd',
                       'about': '?'
                    },
                help: 'shift+i',
                context: ctx
            };

        Hotkeys.VimlikeKeys.bind(vim_keys);
        Hotkeys.FormKeys.bind(form_keys);
        Hotkeys.OtherKeys.bind(other_keys);

        if (!method_alias) method_alias = 'hotkeys';
        app.helper(method_alias, this);
    };

})(jQuery, window.Sammy);
