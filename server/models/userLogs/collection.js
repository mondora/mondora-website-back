Schema.UserLog = new SimpleSchema({
	userId: {
		type: String
	},
	date: {
		type: Number
	},
	details: {
		type: Object,
		blackbox: true
	}
});

UserLogs = new Meteor.Collection("userLogs", {
	schema: Schema.UserLog
});
