Meteor.publish("singlePost", function (idOrTitle) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Posts.getPermissionsSelector(user);
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
	var permissionsSelector = PermissionsEnum.Posts.getPermissionsSelector(user);
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



Meteor.publish("latestPosts", function (limit) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Posts.getPermissionsSelector(user);
	// Construct the selector
	var selector = {
		$and: [
			{
				// Select only published posts
				published: true
			},
			permissionsSelector
		]
	};
	// Sanitize the limit
	limit = parseInt(limit, 10);
	limit = isNaN(limit) ? 10 : limit;
	var options = {
		limit: limit,
		sort: {
			publishedOn: -1
		},
		fields: {
			title: 1,
			subtitle: 1,
			authors: 1,
			publishedOn: 1,
			published: 1,
			likedBy: 1
		}
	};
	// Return the cursor finding those posts
	return Posts.find(selector, options);
});



Meteor.publish("postDrafts", function (limit) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Posts.getPermissionsSelector(user);
	// Construct the selector
	var selector = {
		$and: [
			{
				// Select only published posts
				published: false
			},
			permissionsSelector
		]
	};
	// Sanitize the limit
	limit = parseInt(limit, 10);
	limit = isNaN(limit) ? 10 : limit;
	var options = {
		limit: limit,
		sort: {
			publishedOn: -1
		},
		fields: {
			title: 1,
			subtitle: 1,
			authors: 1,
			publishedOn: 1,
			published: 1
		}
	};
	// Return the cursor finding those posts
	return Posts.find(selector, options);
});
