Schema.PomodoroEvents = new SimpleSchema({
	time: {
		type: Number
	},
	userId: {
		type: String
	},
	action: {
		type: String
	}
});
Schema.PomodoroParticipants = new SimpleSchema({
	userId: {
		type: String
	},
	name: {
		type: String,
		optional: true
	},
	screenName: {
		type: String,
		optional: true
	},
	pictureUrl: {
		type: String,
		optional: true
	}
});
Schema.Pomodoro = new SimpleSchema({
	userId: {
		type: String
	},
	events: {
		type: [Schema.PomodoroEvents],
		optional: true
	},
	participants: {
		type: [Schema.PomodoroParticipants],
		optional: true
	},
	objective: {
		type: String,
		optional: true
	},
	status: {
		type: String
	},
	duration: {
		type: Number
	}
});

Pomodoros = new Meteor.Collection("pomodoros", {
	schema: Schema.Pomodoro
});
