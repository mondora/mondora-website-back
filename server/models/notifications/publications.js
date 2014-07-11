Meteor.publish("notificationChannel", function (channel, limit) {
	var notificationChannel = NotificationChannels.findOne({name: channel});
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	var userHasAccess = PermissionsEnum.Notifications.userHasAccess(channel, user);
	if (!userHasAccess) {
		return null;
	}
	var selector = {
		channel: channel
	};
	var options = {
		limit: limit
	};
	return Notifications.find(selector, options);
});
