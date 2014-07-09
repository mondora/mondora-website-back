Meteor.publish("singlePost", function (idOrTitle) {

	// Get the post
	var post = Posts.findOne({
		$or: [
			{
				_id: idOrTitle
			},
			{
				title: idOrTitle
			}
		]
	});
	// If no post matched the query, return null
	if (!post) {
		return null;
	}

	// Get the user (if he's not logged in, use an empty object to represent him)
	var user = Meteor.users.findOne({_id: this.userId}) || {};

	// If the user doesn't have access to the post, return null
	if (!PermissionsEnum.Posts.userHasAccess(user, post)) {
		return null;
	}

	// Return the cursor finding that post
	return Posts.find({_id: post._id});

});



Meteor.publish("postsByAuthor", function (authorId) {
	var selector = {
		// Select only published posts
		published: true,
		// Authored by userId
		authors: {
			$elemMatch: {
				userId: authorId
			}
		}
	};
	return Posts.find(selector);
});
