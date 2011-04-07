#!/bin/sh

BASEURL="http://github.com/api/v2/json/repos/show/vim-scripts?page="
SCRIPTS_FILE="../vim-scripts.json"


getTotalPages() {
    local total=`curl -# -I $BASEURL"1" | grep -o -E "^X-Last.*$" | grep -o -E "[0-9]+" | tail -1`
    echo "$total"
}

scrape() {
    if test $1; then
        local offset=$1
    else
        local offset=1
    fi
    local ttlpages=$(getTotalPages)

    while [ $offset -le $ttlpages ]; do
        echo "Retrieving repo info from page $offset of $ttlpages"
        curl -# $BASEURL$offset | jsonpretty >> $SCRIPTS_FILE
        let offset=offset+1
    done
}


#
# Usage: ./repo_scraper.sh [page_offset]
#

if test $# -eq 0; then
    scrape
else
    scrape $1
fi
