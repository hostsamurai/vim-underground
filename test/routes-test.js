var zombie = require('zombie'),
    assert = require('assert'),
    vows = require('vows'),
    events = require('events');

const HOMEPAGE = 'http://vu.couchdb:5984';

vows.describe("homepage").addBatch({
    'should': {
        topic: function () {
            var promise = new events.EventEmitter;

            zombie.visit('http://vu.couchdb:5984/', function(err, browser, status) {
                if (err) promise.emit('error', err);
                else promise.emit('success', browser);
            });

            return promise;
        },

        'contain': {
            topic: function(promise) { return promise; },

            'articles': function(err, browser) {
                assert.equal(browser.text('#articles h2'), 'Latest Articles');
                assert.equal(browser.css('.blurb', browser.querySelector('#articles')).length, 15);
            },

            'script updates': function(err, browser) {
                assert.equal(browser.text('#scripts h2'), 'Latest Script Activity');
                assert.equal(browser.css('.blurb', browser.querySelector('#scripts')).length, 12);
            },

            'screencasts': function(err, browser) {
                assert.equal(browser.text('#screencasts h2'), 'Latest Screencasts');
                assert.equal(browser.css('.blurb', browser.querySelector('#screencasts')).length, 6);
            }
        }
    }
}).export(module);


function assertLocation(browser, location) {
    browser.clickLink('#' + location + ' .more', function(err, b, status) {
        assert.equal(b.location, '/' + location);
    });
}

vows.describe('linking').addBatch({
    'to articles page': {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should land me there': function(err, browser) {
            assertLocation(browser, 'articles');
        }
    },

    "to screencasts page": {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should land me there': function(err, browser) {
            assertLocation(browser, 'screencasts');
        }
    },

    "to scripts page": {
        topic: function () { return zombie.visit(HOMEPAGE, this.callback); },

        'should land me there': function(err, browser) {
            assertLocation(browser, 'scripts');
        }
    }
}).export(module);
