Meteor.methods({



	dismissNotificationFromHomepage: function (notificationId) {
		var selector = {
			_id: notificationId,
			userId: Meteor.userId()
		};
		var modifier = {
			$addToSet: {
				tags: "dismissedFromHomepage"
			}
		};
		Notifications.update(selector, modifier);
	}



});
