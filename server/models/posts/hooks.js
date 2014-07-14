Posts.after.update(function (userId, post) {
	if (
		post.published &&
		post.published !== this.previous.published &&
		post.notifyOnPublication
	) {
		var notification = {
			channel: "post:newPublic",
			type: "newPost",
			details: {
				postId: post._id,
				postTitle: post.title,
				from: post.authors[0]
			},
			date: Date.now()
		};
		Notifications.insert(notification);
	}
});
