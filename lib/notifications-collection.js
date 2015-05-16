Schema.Notification = new SimpleSchema({
	// The `name` of the channel
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
	},
	dismissedBy: {
		type: [String],
		optional: true
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

NotificationChannels = new Mongo.Collection("notificationChannels");
NotificationChannels.attachSchema(Schema.NotificationChannel);

Notifications = new Mongo.Collection("notifications");
Notifications.attachSchema(Schema.Notification);
