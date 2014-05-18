///////////
// Utils //
///////////

var canPost = function (userId) {
	return userId && Roles.userIsInRole(userId, "blog");
};
var isNotOwner = function (userId, post) {
	return post.userId !== userId;
};
var isNotAuthor = function (userId, post) {
	var isAuthor = false;
	_.forEach(post.authors, function (author) {
		if (author.userId === userId) {
			isAuthor = true;
		}
	});
	return !isAuthor;
};

///////////////////////////////////
// Posts collections permissions //
///////////////////////////////////

// - Login is required to modify the "posts" collection directly
// - Having the "blog" role is also required
Posts.allow({
	insert: canPost,
	update: canPost,
	remove: canPost
});

Posts.deny({



	// Insert policies:
	// - prevent spoofing the owner
	insert: function (userId, post) {
		if (isNotOwner(userId, post)) {
			// Trying to spoof the owner, deny
			return true;
		}
		// The insert is safe, don't deny
		return false;
	},



	// Update policies:
	// - only owners and authors can update the post
	// - allow owners to modify everything except
	//   the owner
	// - allow authors to modify everything except
	//   the owner and the authors list
	update: function (userId, post, fields) {
		if (isNotOwner(userId, post)) {
			// Is not the owner
			if (isNotAuthor(userId, post)) {
				// Not the owner and not an author, deny
				return true;
			}
			// Author but not owner
			if (_.contains(fields, "userId")) {
				// Trying to modify the owner, deny
				return true;
			}
			if (_.contains(fields, "authors")) {
				// Trying to modify the authors, deny
				return true;
			}
			// The uodate is safe don't deny
			return false;
		}
		// Is the owner
		if (_.contains(fields, "userId")) {
			// Trying to modify the owner, deny
			return true;
		}
		// The uodate is safe don't deny
		return false;
	},



	// Remove policies:
	// - only the owner can remove a post
	remove: function (userId, post) {
		if (isNotOwner(userId, post)) {
			// Trying to remove another's post, deny
			return true;
		}
		// The remove is safe, don't deny
		return false;
	}



});
