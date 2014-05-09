Accounts.onCreateUser(function (options, user) {
	user.twitterProfile = {
		name: options.profile.name,
		screenName: user.services.twitter.screenName,
		pictureUrl: user.services.twitter.profile_image_url_https
	};
	user.roles = ["blog"];
	user.profile = {};
	return user;
});
