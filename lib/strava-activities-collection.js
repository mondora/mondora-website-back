Schema.Athlete = new SimpleSchema({
    id: {
        type: Number
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
    stravaId: {
        type: Number,
        unique: true
    },
    type: {
        type: String
    },
    name: {
        type: String
    },
    date: {
        type: Date
    },
    dateUTC: {
        type: Date
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