Cron.downloadStravaActitivities = function () {
    // Retrieve last activity from db
    var lastActivity = StravaActivities.findOne({}, {sort: {date: -1}});
    var params = {};
    if (lastActivity) {
        // Activity found, set after param
        params.after = lastActivity.date.getTime() / 1000;
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

            for(var i = 0; i < size; i++) {
                // Add activity to db
                StravaActivities.insert({
                    type: activities[i].type,
                    name: activities[i].name,
                    date: activities[i].start_date_local,
                    distance: activities[i].distance,
                    elapsedTime: activities[i].elapsed_time,
                    elevation: activities[i].total_elevation_gain,
                    stravaId: activities[i].id,
                    athlete: {
                        id: activities[i].athlete.id,
                        firstname: activities[i].athlete.firstname,
                        lastname: activities[i].athlete.lastname,
                        profile: activities[i].athlete.profile,
                        profileMedium: activities[i].athlete.profile_medium
                    }
                });
            }
        });
}

Meteor.setInterval(Cron.downloadStravaActitivities, process.env.STRAVA_REFRESH_INTERVAL);