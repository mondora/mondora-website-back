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
		return _.contains(fields, "userId");
	}
});
Posts.deny({
	update: function (userId, post, fields) {
		if (isNotAuthor(userId, post)) return;
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
