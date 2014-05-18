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
	return user;
});
