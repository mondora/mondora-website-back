Meteor.publish("latestPosts", function () {
	var selector = {
		published: true
	};
	var options = {
		limit: 10
	};
	return Posts.find(selector, options);
});

Meteor.publish("singlePost", function (postId) {
	var selector = {
		$or: [
			{
				_id: postId,
				// Publish the post if the user owns it
				userId: this.userId
			},
			{
				_id: postId,
				// Or if the post is published
				published: true
			}
		]
	};
	return Posts.find(selector);
});
