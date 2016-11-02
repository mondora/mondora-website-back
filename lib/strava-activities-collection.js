Schema.Athlete = new SimpleSchema({
    _id:{
        type: String
    },
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    profile: {
        type: String
    },
    profileMedium: {
        type: String
    }
});
Schema.StravaActivity = new SimpleSchema({
    type: {
        type: String
    },
    name: {
        type: String
    },
    dateUTC: {
        type: Number,
        decimal: false
    },
    timezone: {
        type: String
    },
    distance: {
        type: Number,
        decimal: true
    },
    elapsedTime: {
        type: Number
    },
    elevation: {
        type: Number,
        decimal: true
    },
    athlete: {
        type: Schema.Athlete
    }
});

StravaActivities = new Mongo.Collection("stravaActivities");
StravaActivities.attachSchema(Schema.StravaActivity);