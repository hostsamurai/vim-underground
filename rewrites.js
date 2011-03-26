/**
 * this file contains the json representation for rewrite rules
**/
[
    { // rewriting / to index.html
        "from":"/",
        "to":"_list/blurbs/latest_articles",
        "method":"GET",
        "query":{
            "descending": true,
            "limit": 15,
            "rows": 3,
            "cols": 5,
            "heading": "Latest Articles",
            "page": "index"
        }
    },

    { // keeping relative urls sane
        "from":"/*",
        "to":"/*"
    }
]
