var zombie = require('zombie'),
    assert = require('assert'),
    vows = require('vows'),
    events = require('events');

const HOMEPAGE = 'http://vu.couchdb:5984';

vows.describe('new article submission form').addBatch({
    'monitor for bots': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'when hidden fields are filled in': function(err, browser) {
            browser.fill("lol1", "i'm a bot").pressButton('Submit', function(err) {
                assert.ifError(err);
            });
        }
    },

    'unsuccessful submission': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should not submit form when no inputs are filled in': function(browser) {
            browser.pressButton('Submit', function (err, b) {
                assert.match(b.text('.error-msg:first'),  /Not a valid URL/);
                assert.match(b.text('.error-msg:nth(1)'), /Too short/);
                assert.match(b.text('.error-msg:last'),   /This field is required/);
                // FIXME: looks like jsdom doesn't detect appended elements?
                //assert.match(b.text('.submit-error'),
                             ///Sorry, your submission didn't go through./);
            });
        }
    },

    'successful submission': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should submit form when al valid inputs are filled in': function(browser) {
            browser.fill('[name=link]', 'http://example.com')
                   .fill('[name=title]', 'Something Awesome This Way Comes')
                   .fill('[name=summary]', "It's awesome")
                   .pressButton('Submit', function (err, b) {
                        assert.match(b.text('.submit-success'),
                                     /Article successfully submitted!/);
                });
        }
    },

    'duplicate entry submission': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should not create another article with the same URL': function(browser) {
            browser.fill('link', 'http://example.com')
                   .fill('title', 'Something Awesome This Way Comes')
                   .fill('summary', "It's awesome")
                   .pressButton('Submit', function (err, b) {
                        assert.match(b.text('.submit-error'),
                                     /An article with the same URL already exists\./);
                });
        }
    }
}).export(module);
