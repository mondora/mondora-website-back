Meteor.publish("notificationChannel", function (channelName, notificationsLimit) {
	// Check argument types
	check(channelName, String);
	check(notificationsLimit, Match.Optional(Number));
	// Keep a reference of the context
	var self = this;
	// Get the user
	var user = Meteor.users.findOne({_id: self.userId}) || {};
	// Get the channel object
	var notificationChannel = NotificationChannels.findOne({name: channelName});
	if (!notificationChannel) {
		return null;
	}
	// Check if the user has access to the channel
	var hasAccess = PermissionsEnum.Notifications.userHasAccess(user, notificationChannel);
	if (!hasAccess) {
		return null;
	}
	// Construct the selector and the options
	var selector = {
		channel: channelName,
		dismissedBy: {
			$nin: [user._id]
		}
	};
	var options = {
		sort: {
			"date": -1
		},
		limit: notificationsLimit || 10
	};
	// Return the cursor
	return Notifications.find(selector, options);
});
