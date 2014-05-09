///////////
// Utils //
///////////

var canPost = function (userId) {
	return Roles.userIsInRole(userId, "blog");
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

Posts.allow({
	insert: canPost,
	update: canPost,
	remove: canPost
});

Posts.deny({
	insert: isNotOwner,
	update: isNotAuthor,
	remove: isNotOwner
});
