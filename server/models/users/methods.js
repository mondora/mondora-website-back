Meteor.methods({



	/////////////////////
	// Role management //
	/////////////////////

	addUserToRole: function (userId, role) {
		if (role === "admin") {
			throw new Meteor.Error("Marking users as admins is not possible from the web interface");
		}
		if (!PermissionsEnum.Users.isAdmin(userId)) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$addToSet: {roles: role}});
	},

	removeUserFromRole: function (userId, role) {
		if (role === "admin") {
			throw new Meteor.Error("Marking users as admins is not possible from the web interface");
		}
		if (!PermissionsEnum.Users.isAdmin(userId)) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$pull: {roles: role}});
	},



	//////////////////////
	// Group management //
	//////////////////////

	addUserToGroup: function (userId, group) {
		if (!PermissionsEnum.Users.isAdmin(userId)) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$addToSet: {groups: group}});
	},

	removeUserFromGroup: function (userId, group) {
		if (!PermissionsEnum.Users.isAdmin(userId)) {
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



	////////////
	// Emails //
	////////////

	addEmailToUser: function (email) {
		var user = Meteor.user();
		if (
			_
				.chain(user.emails)
				.pluck("address")
				.contains(email)
				.value()
		) {
			return;
		}
		var selector = {
			_id: user._id
		};
		var modifier = {
			$addToSet: {
				emails: {
					address: email,
					verified: false
				}
			}
		};
		Meteor.users.update(selector, modifier);
		Accounts.sendVerificationEmail(user._id, email);
	},

	removeEmailFromUser: function (email) {
		var selector = {
			_id: Meteor.userId()
		};
		var modifier = {
			$pull: {
				emails: {
					address: email
				}
			}
		};
		Meteor.users.update(selector, modifier);
	},

	resendVerificationEmail: function (email) {
		Accounts.sendVerificationEmail(Meteor.userId(), email);
	}


});
