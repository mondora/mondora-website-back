Schema.Notification = new SimpleSchema({
	channel: {
		type: String
	},
	type: {
		type: String
	},
	details: {
		type: Object,
		optional: true,
		blackbox: true
	},
	date: {
		type: Number
	}
});

Schema.NotificationChannel = new SimpleSchema({
	name: {
		type: String,
		index: true,
		unique: true
	},
	permissions: {
		type: Schema.SharePermissions
	}
});

NotificationChannels = new Meteor.Collection("notificationChannels", {
	schema: Schema.NotificationChannel
});

Notifications = new Meteor.Collection("notifications", {
	schema: Schema.Notification
});
