var zombie = require('zombie'),
    assert = require('assert'),
    vows = require('vows'),
    events = require('events');

const HOMEPAGE = 'http://vu.couchdb:5984';

vows.describe('new article submission form').addBatch({
    'monitor for bots': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'when hidden fields are filled in': function(err, browser) {
            // NOTE: how to prevent stack trace from showing in the runner's
            //       output?
            browser.fill("lol1", "i'm a bot").pressButton('Submit', function(err) {
                assert.ifError(err);
            });
        }
    },

    'unsuccessful submission': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should not submit form when no inputs are filled in': function(browser) {
            browser.pressButton('Submit', function (err, b) {
                assert.match(b.text('.submit-error'),
                             /Sorry, your submission didn't go through./);
                console.log( b.text("Error: ", '.submit-error') );
            });
        }
    },

    'successful submission': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should submit form when al valid inputs are filled in': function(browser) {
            browser.fill('link', 'http://example.com')
                   .fill('title', 'Something Awesome This Way Comes')
                   .fill('summary', "It's awesome")
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
