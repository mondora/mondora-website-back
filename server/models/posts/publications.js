Meteor.publish("singlePost", function (idOrTitle) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Posts.getPermissionsSelectorForUser(user);
	// Construct the selector
	var selector = {
		$and: [
			{
				$or: [
					{
						_id: idOrTitle
					},
					{
						title: idOrTitle
					}
				]
			},
			permissionsSelector
		]
	};
	// Return the cursor finding that post
	return Posts.find(selector);
});



Meteor.publish("postsByAuthor", function (authorId) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Posts.getPermissionsSelectorForUser(user);
	// Construct the selector
	var selector = {
		$and: [
			{
				// Select only published posts
				published: true,
				// Authored by userId
				authors: {
					$elemMatch: {
						userId: authorId
					}
				}
			},
			permissionsSelector
		]
	};
	// Return the cursor finding those posts
	return Posts.find(selector);
});
