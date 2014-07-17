Meteor.methods({



	/////////////////////
	// Role management //
	/////////////////////

	addUserToRole: function (userId, role) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$addToSet: {roles: role}});
	},

	removeUserFromRole: function (userId, role) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$pull: {roles: role}});
	},



	//////////////////////
	// Group management //
	//////////////////////

	addUserToGroup: function (userId, group) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$addToSet: {groups: group}});
	},

	removeUserFromGroup: function (userId, group) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$pull: {groups: group}});
	},



	////////////////////////////////
	// Notification subscriptions //
	////////////////////////////////

	subscribeToNotificationChannel: function (channelName) {
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		Meteor.users.update({_id: user._id}, {
			$addToSet: {
				notificationChannelSubscriptions: channelName
			}
		});
	},

	unsubscribeFromNotificationChannel: function (channelName) {
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		Meteor.users.update({_id: user._id}, {
			$pull: {
				notificationChannelSubscriptions: channelName
			}
		});
	},


});
