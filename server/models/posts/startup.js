Meteor.startup(function () {
	var newPostsChannel = NotificationChannels.findOne({name: "post:newPublic"});
	if (!newPostsChannel) {
		NotificationChannels.insert({
			name: "post:newPublic",
			permissions: {
				public: true
			}
		});
	}
});
