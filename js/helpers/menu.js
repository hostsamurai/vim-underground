(function($, Sammy) {
    var MenuUpdater = {
        coversViewport: function($div) {
            var winX = $(window).scrollLeft(),
                divX = $div.position().left * 1.0;

            if ( winX === divX ) {
                return true;
            } else if (divX > 0 && winX/divX >= 0.5) {
                return true;
            }

            return false;
        },

        isViewable: function($div) {
            return $div.has(':in-viewport').length !== 0 && this.coversViewport($div) ? true : false;
        },

        configMenu: function(directions) {
            if (!this.signaledCorrectly(directions)) {
                $('.link-wrapper').removeClass('down-arrow left-arrow right-arrow')
                                  .first()
                                  .addClass(directions.first)
                                  .end()
                                  .filter(':nth-child(2)')
                                  .addClass(directions.second)
                                  .end()
                                  .filter(':nth-child(3)')
                                  .addClass(directions.third)
                                  .end()
                                  .last()
                                  .addClass(directions.last);
            }
        },

        signaledCorrectly: function(directions) {
            var $nav = $('.link-wrapper');

            return $nav.first().hasClass(directions.first).length > 0 &&
                   $nav.filter(':nth-child(2)').hasClass(directions.second).length > 0 &&
                   $nav.filter(':nth-child(3)').hasClass(directions.third).length > 0 &&
                   $nav.last().hasClass(directions.last).length > 0;
        },

        updateMenu: function($container) {
            switch ($container.attr('id')) {
            case "articles":
                this.configMenu({
                    first:  'down-arrow', second: 'right-arrow',
                    third:  'right-arrow', last:   'right-arrow'
                });
                break;
            case "screencasts":
                this.configMenu({
                    first:  'left-arrow', second: 'down-arrow',
                    third:  'right-arrow', last:   'right-arrow'
                });
                break;
            case "scripts":
                this.configMenu({
                    first:  'left-arrow', second: 'left-arrow',
                    third:  'down-arrow', last:   'right-arrow'
                });
                break;
            case "about":
                this.configMenu({
                    first:  'left-arrow', second: 'left-arrow',
                    third:  'left-arrow', last:   'down-arrow'
                });
                break;
            default:
                $('.link-wrapper').removeClass('down-arrow left-arrow right-arrow')
                                  .addClass('left-arrow');
            }
        },

        updateHeader: function($container) {
            var container_id = $container.attr('id'),
                mappings = {
                    articles: "Latest Articles",
                    screencasts: "Latest Screencasts",
                    scripts: "Scripts",
                    about: "About",
                    feeds: "Feeds"
                };

            $('#page-info').text(function(i, text) {
                var id_text = mappings[container_id];
                if (text !== id_text) $(this).text(id_text);
            });
        }
    };


    Sammy = Sammy || {};

    Sammy.MenuUpdater = function(app, method_alias) {
        var menu_updater = function() {
            var $container = $('.container:in-viewport');

            if (MenuUpdater.isViewable($container)) {
                MenuUpdater.updateMenu($container);
                MenuUpdater.updateHeader($container);
            }
        };

        if (!method_alias) method_alias = 'menu_updater';
        app.helper(method_alias, menu_updater);
    };

})(jQuery, window.Sammy);
