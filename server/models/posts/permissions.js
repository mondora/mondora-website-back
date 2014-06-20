// Utils

// Role membership
var isInRoleBlog = function (userId) {
	return userId && Roles.userIsInRole(userId, "blog");
};

// Ownership
var isOwner = function (userId, post) {
	return post.userId === userId;
};
var isNotOwner = function (userId, post) {
	return !isOwner(userId, post);
};

// Authorship
var isAuthor = function (userId, post) {
	var isAuthor = false;
	_.forEach(post.authors, function (author) {
		if (author.userId === userId) {
			isAuthor = true;
		}
	});
	return isAuthor;
};
var isNotAuthor = function (userId, post) {
	return !isAuthor(userId, post);
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
	insert: isInRoleBlog
});

Posts.deny({
	insert: isNotOwner
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
 *
 */

Posts.allow({
	update: isOwner
});
Posts.allow({
	update: isAuthor
});

Posts.deny({
	update: function (userId, post, fields) {
		if (isNotOwner(userId, post)) return;
		return _.contains(fields, "userId");
	}
});
Posts.deny({
	update: function (userId, post, fields) {
		if (isNotAuthor(userId, post)) return;
		if (isOwner(userId, post)) return;
		return _.contains(fields, "userId");
	}
});
Posts.deny({
	update: function (userId, post, fields) {
		if (isNotAuthor(userId, post)) return;
		if (isOwner(userId, post)) return;
		return _.contains(fields, "authors");
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow owners to remove the post
 *
 */

Posts.allow({
	remove: isOwner
});



/*
 *	POST SELECTOR
 *
 */

CollectionSelector.PostAllowedUsers = function (idOrTitle, userId) {
	var user = userId ? Meteor.users.findOne({_id: userId}) : {};
	return {
		$and: [
			{
				// Find the post by _id or title
				$or: [
					{
						_id: idOrTitle
					},
					{
						title: idOrTitle
					}
				]
			},
			{
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
			}
		]
	};
};
