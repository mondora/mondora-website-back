Accounts.onCreateUser(function (options, user) {
	user.profile = {
		name: options.profile.name,
		screenName: user.services.twitter.screenName,
		pictureUrl: user.services.twitter.profile_image_url_https
	};
	return user;
});
