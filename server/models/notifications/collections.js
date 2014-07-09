Schema.Notification = new SimpleSchema({
	userId: {
		type: String
	},
	from: {
		type: [Schema.UserSummary],
		optional: true
	},
	subject: {
		type: String,
		optional: true
	},
	details: {
		type: Object,
		optional: true,
		blackbox: true
	},
	tags: {
		type: [String],
		optional: true
	},
	category: {
		type: String,
		optional: true
	},
	date: {
		type: Number,
		optional: true
	}
});

Notifications = new Meteor.Collection("notifications", {
	schema: Schema.Notification
});
