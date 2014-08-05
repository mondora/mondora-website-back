Schema.PomodoroEvents = new SimpleSchema({
	userId: {
		type: String
	},
	time: {
		type: Number
	},
	action: {
		type: String
	},
	reason: {
		type: String,
		optional: true
	}
});

Schema.Pomodoro = new SimpleSchema({
	_id: {
		type: String
	},
	events: {
		type: [Schema.PomodoroEvents],
		optional: true
	},
	status: {
		type: String
	},
	duration: {
		type: Number
	},
	anchor: {
		type: String,
		optional: true
	}
});

Schema.Task = new SimpleSchema({
	userId: {
		type: String
	},
	participants: {
		type: [Schema.UserSummary],
		optional: true
	},
	name: {
		type: String,
		optional: true
	},
	description: {
		type: String,
		optional: true
	},
	tags: {
		type: [String],
		optional: true
	},
	status: {
		type: String,
		optional: true
	},
	details: {
		type: Object,
		blackbox: true,
		optional: true
	},
	date: {
		type: Number,
		optional: true
	},
	pomodoros: {
		type: [Schema.Pomodoro],
		optional: true
	},
	addedOn: {
		type: Number,
		optional: true
	},
	addedBy: {
		type: Schema.UserSummary,
		optional: true
	}
});

Tasks = new Meteor.Collection("tasks", {
	schema: Schema.Task
});
