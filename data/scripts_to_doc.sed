# change second line to reference "docs"
2s|"repositories":|"docs":|

# upload all or none
2i \  "all_or_nothing": true,

# not interested in the following fields
s/^\s+"(has_downloads|forks?|watchers|has_wiki|open_issues|has_issues|size|private|owner)"\:.*//g
/^$/d

## use only one huge repositories array
# FIXME: the expression below partially works. The following works in vim:
#
#        %s/\v\}\n\s+\]\n\}\n\{\n\s+\"repositories\"\:\s\[/},/g
#
#        How can this be done in sed?
#1!N; s|[}].*]|},|; s|[}]\n[{]||; s|"repositories"\:\s\[|| p;
#/^$/d

# specify the type of record we're storing 
/"name": (.+),/ a\
      "type": "script",
