exports.truncateTitle = function(title) {
    return title.length > 35 ? title.substr(0,33) + "&hellip;" : title;
};

exports.shortDate = function(time) {
    return time.substr(0,10).replace(/-|\//g, '.');
};

exports.truncateDesc = function(desc) {
    return desc !== undefined && desc.length > 378 ?
        desc.substr(0,375) + "&hellip;" :
        desc;
};
