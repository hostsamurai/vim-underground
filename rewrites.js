/**
 * this file contains the json representation for rewrite rules
**/
[
    { // rewriting / to index.html
        "from": "/",
        "to": "_list/blurbs/latest_articles",
        "method": "GET",
        "query": {
            "descending": true,
            "limit": 15,
            "rows": 3,
            "cols": 5,
            "heading": "Latest Articles",
            "type": "articles",
            "bottomRow": "true",
            "page": "index"
        }
    },

    { // /articles
        "from": "/articles",
        "to": "_list/blurbs/latest_articles",
        "method": "GET",
        "query": {
            "descending": true,
            "limit": 25,
            "rows": 5,
            "cols": 5,
            "heading": "Latest Articles",
            "type": "articles",
            "page": "index"
        }
    },

    { // /screencasts
        "from": "/screencasts",
        "to": "_list/blurbs/latest_screencasts",
        "method": "GET",
        "query": {
            "descending": true,
            "limit": 25,
            "rows": 5,
            "cols": 5,
            "heading": "Latest Screencasts",
            "type": "t-screencasts",
            "page": "index"
        }
    },

    { // /scripts
        "from": "/scripts",
        "to": "_list/blurbs/script_fragment",
        "method": "GET",
        "query": {
            "descending": true,
            "limit": 21,
            "rows": 7,
            "cols": 3,
            "heading": "Latest Script Updates",
            "type": "t-scripts",
            "page": "index"
        }
    },

    { // articles feed
        "from": "/articles-feed",
        "to": "_list/blurbs/latest_articles",
        "method": "GET",
        "query": {
            "descending": true,
            "limit": 20,
            "format": "atom",
            "title": "Articles Feed"
        }
    },

    { // screencasts feed
        "from": "/screencasts-feed",
        "to": "_list/blurbs/latest_screencasts",
        "method": "GET",
        "query": {
            "descending": true,
            "limit": 20,
            "format": "atom",
            "title": "Screencasts Feed"
        }
    },

    { // about page
        "from": "/about",
        "to": "about.html",
        "method": "GET",
        "query": {}
    },

    { // contact page emails
        "from": "/mail",
        "to": "../../_mailer",
        "method": "POST",
        "query": {}
    },

    { // for accessing lists from jquery.couch
        "from": "*/_design/*/_list/*",
        "to": "_list/*",
        "method": "GET"
    },

    { // keeping relative urls sane
        "from": "/*",
        "to": "/*"
    }
]
