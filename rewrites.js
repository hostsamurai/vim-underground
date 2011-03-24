/**
 * this file contains the json representation for rewrite rules
**/
[
    { // rewriting / to index.html
        "from":"/",
        "to":"_list/articles/latest_articles",
        "method":"GET",
        "query":{
            "descending": true,
            "limit": 15
        }
    },

    { // keeping relative urls sane
        "from":"/*",
        "to":"/*"
    }
]
