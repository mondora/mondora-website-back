/*
 *	Notifications are only be added, updated and removed
 *	by the server.
 *
 */

PermissionsEnum.Notifications = {};

// Access permissions
PermissionsEnum.Notifications.userHasAccess = function (user, notificationChannel) {
	// The user can access the notification when either:
	return (
		// the notificationChannel is public
		notificationChannel.permissions.public ||
		// the user belongs to a group the notificationChannel has been shared to
		_.intersection(user.groups, notificationChannel.permissions.groups).length > 0 ||
		// the notificationChannel has been shared to the user
		_.contains(notificationChannel.permissions.members, user._id)
	);
};
