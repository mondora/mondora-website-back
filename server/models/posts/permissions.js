///////////////////////////////////////
// PermissionsEnum methods for posts //
///////////////////////////////////////

PermissionsEnum.Posts = {};

// Role membership
PermissionsEnum.Posts.isInRoleBlog = function (userId) {
	return userId && Roles.userIsInRole(userId, "blog");
};
// Ownership
PermissionsEnum.Posts.isOwner = function (userId, post) {
	return post.userId === userId;
};
PermissionsEnum.Posts.isNotOwner = function (userId, post) {
	return !PermissionsEnum.Posts.isOwner(userId, post);
};
// Authorship
PermissionsEnum.Posts.isAuthor = function (userId, post) {
	var isAuthor = false;
	_.forEach(post.authors, function (author) {
		if (author.userId === userId) {
			isAuthor = true;
		}
	});
	return isAuthor;
};
PermissionsEnum.Posts.isNotAuthor = function (userId, post) {
	return !PermissionsEnum.Posts.isAuthor(userId, post);
};
// Access permissions
PermissionsEnum.Posts.userHasAccess = function (user, post) {
	// The user can access the post when either:
	return (
		// the user is the owner
		PermissionsEnum.Posts.isOwner(user._id, post) ||
		// the user is an author
		PermissionsEnum.Posts.isAuthor(user._id, post) ||
		(
			// the post is published and either:
			post.published === true &&
			(
				// the post is public
				post.permissions.public ||
				// the user belongs to a group the post has been shared to
				_.intersection(user.groups, post.permissions.groups).length > 0 ||
				// the post has been shared to the user
				_.contains(post.permissions.members, user._id)
			)
		)
	);
};
// Selector for publish functions
PermissionsEnum.Posts.getPermissionsSelectorForUser = function (user) {
	return {
		// For the post to be selected either:
		$or: [
			{
				// The user must be the owner
				userId: user._id
			},
			{
				// The user must be one of the authors
				authors: {
					$elemMatch: {
						userId: user._id
					}
				}
			},
			{
				// The post must be published and either
				$and: [
					{
						published: true
					},
					{
						$or: [
							{
								// The user is in one of the allowed groups
								"permissions.groups": {
									// The user may not have a groups property
									$in: user.groups || []
								}
							},
							{
								// The user is a member of the post
								"permissions.members": {
									$in: [user._id]
								}
							},
							{
								// The post is public
								"permissions.public": true
							}
						]
					}
				]
			}
		]
	};
};



/*
 *	INSERT POLICIES
 *
 *	- allow users in role "blog" to insert posts (implies being logged in)
 *
 *	- deny insertion with spoofed userId
 *
 */

Posts.allow({
	insert: PermissionsEnum.Posts.isInRoleBlog
});

Posts.deny({
	insert: PermissionsEnum.Posts.isNotOwner
});



/*
 *	UPDATE POLICIES
 *
 *	- allow owners to update the post
 *	- allow authors to update the post
 *
 *	- deny owners to modify the owner
 *	- deny authors to modify the owner
 *	- deny authors to modify the authors
 *	- deny authors to modify permissions
 *
 */

Posts.allow({
	update: PermissionsEnum.Posts.isOwner
});
Posts.allow({
	update: PermissionsEnum.Posts.isAuthor
});

Posts.deny({
	update: function (userId, post, fields) {
		if (PermissionsEnum.Posts.isNotOwner(userId, post)) return;
		return _.contains(fields, "userId");
	}
});
Posts.deny({
	update: function (userId, post, fields) {
		if (PermissionsEnum.Posts.isNotAuthor(userId, post)) return;
		if (PermissionsEnum.Posts.isOwner(userId, post)) return;
		return _.contains(fields, "userId");
	}
});
Posts.deny({
	update: function (userId, post, fields) {
		if (PermissionsEnum.Posts.isNotAuthor(userId, post)) return;
		if (PermissionsEnum.Posts.isOwner(userId, post)) return;
		return _.contains(fields, "authors") || _.contains(fields, "permissions");
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow owners to remove the post
 *
 */

Posts.allow({
	remove: PermissionsEnum.Posts.isOwner
});
