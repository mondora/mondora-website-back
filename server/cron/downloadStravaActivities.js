Cron.downloadStravaActitivities = function () {
    // Retrieve last activity from db
    var lastActivity = StravaActivities.findOne({}, {sort: {dateUTC: -1}});
    var params = {};
    if (lastActivity) {
        // Activity found, set after param
        params.after = lastActivity.dateUTC;
    }

    // Call strava api
    Meteor.http.get(process.env.STRAVA_API_URL, {
            params: params,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.STRAVA_API_TOKEN
            }
        },
        function (err, response) {
            if (err) {
                console.log("An error occurred while downloading data from Strava");
                console.log(err);
                return;
            }
            var activities = response.data;
            var size = activities.length;

            console.log("Found " + size + " new activities");

            for (var i = 0; i < size; i++) {
                // Add activity to db
                try {
                    console.log(activities[i].name);
                    StravaActivities.insert({
                        _id: activities[i].id.toString(),
                        type: activities[i].type,
                        name: activities[i].name,
                        dateUTC: Date.parse(activities[i].start_date) / 1000,
                        timezone: activities[i].timezone.replace(/\(.*\) /,""),
                        distance: activities[i].distance,
                        elapsedTime: activities[i].elapsed_time,
                        elevation: activities[i].total_elevation_gain,
                        athlete: {
                            _id: activities[i].athlete.id.toString(),
                            firstname: activities[i].athlete.firstname,
                            lastname: activities[i].athlete.lastname,
                            profile: activities[i].athlete.profile,
                            profileMedium: activities[i].athlete.profile_medium
                        }
                    });
                } catch (e) {
                    console.log("Error saving activity");
                    console.log(e);
                }

            }
        });
}

Meteor.setInterval(Cron.downloadStravaActitivities, parseInt(process.env.STRAVA_REFRESH_INTERVAL, 10));