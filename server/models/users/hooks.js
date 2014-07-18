Accounts.onCreateUser(function (options, user) {
	// Assign the proposed name
	if (options.profile) {
		user.profile = {
			name: options.profile.name,
		};
	}
	// If the user logged in with twitter, assign this optionals properties
	if (user.services.twitter) {
		user.profile.screenName = user.services.twitter.screenName;
		user.profile.pictureUrl = user.services.twitter.profile_image_url_https;
	}
	// Insert a notification channel for the user
	NotificationChannels.insert({
		name: "user:" + user._id,
		permissions: {
			members: [user._id]
		}
	});
	// Register the user to that notification channel
	user.notificationChannelSubscriptions = [
		"user:" + user._id,
		"post:newPublic"
	];
	return user;
});
