exports.truncateTitle = function(title, length) {
    var length = length || 35;
    return title.length > length ? title.substr(0,length-3) + "&hellip;" : title;
};

exports.shortDate = function(time) {
    return time.substr(0,10).replace(/-|\//g, '.');
};

exports.getParsableDate = function(time) {
    return time.replace(/-/g, "/").replace(/[TZ]/g, " ").replace( /\.000\s$/, "");
};

exports.truncateDesc = function(desc) {
    return desc !== undefined && desc.length > 378 ?
        desc.substr(0,375) + "&hellip;" :
        desc;
};
