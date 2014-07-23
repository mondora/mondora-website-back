Meteor.methods({
	dismissNotification: function (notificationId) {
		var userId = Meteor.userId();
		if (!userId) {
			return;
		}
		Notifications.update({_id: notificationId}, {$addToSet: {dismissedBy: userId}});
	}
});
