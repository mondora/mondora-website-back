Meteor.publish("stravaLastActivities", function (limit) {

    // Construct the selector
    var selector = {};
    // Sanitize the limit
    limit = parseInt(limit, 10);
    limit = isNaN(limit) ? 10 : limit;

    var options = {
        limit: limit,
        sort: {
            date: -1
        }
    }

    return StravaActivities.find(selector, options);
});