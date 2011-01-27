# Run me after doing:
# curl 'http://github.com/api/v2/json/repos/show/vim-scripts' | jsonpretty > data/scripts.json 

# change second line to reference "docs"
s/"repositories":/"docs":/

# upload all or none
2i \  "all_or_nothing": true,

# specify the type of record we're storing 
/"name": (.+),/ a\
      "type": "script",
