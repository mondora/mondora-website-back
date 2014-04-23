var canPost = function (userId) {
	return true;
	//return Roles.userIsInRole(userId, "blog");
};

var isNotOwner = function (userId, post) {
	return post.owner !== userId;
};

var isNotAuthor = function (userId, post) {
	return !_.contains(post.authors, userId);
};

var CommentSchema = new SimpleSchema({
	user: {
		type: String
	},
	paragraph: {
		type: Number
	},
	anchor: {
		type: String,
		optional: true
	},
	content: {
		type: String
	},
	publishedOn: {
		type: Number
	},
	approved: {
		type: String,
		optional: true
	},
	approvedOn: {
		type: Number,
		optional: true
	}
});

var PostSchema = new SimpleSchema({
	user: {
		type: String
	},
	authors: {
		type: [String],
		optional: true
	},
	titleImageUrl: {
		type: String,
		optional: true
	},
	title: {
		type: String,
		optional: true
	},
	subtitle: {
		type: String,
		optional: true
	},
	body: {
		type: String,
		optional: true
	},
	comments: {
		type: [CommentSchema],
		optional: true
	},
	published: {
		type: Boolean,
		optional: true
	},
	publishedOn: {
		type: Number,
		optional: true
	}
});

Posts = new Meteor.Collection("posts", {
	//schema: PostSchema
});

Posts.allow({
	insert: canPost,
	update: canPost,
	remove: canPost
});

/*
Posts.deny({
	insert: isNotOwner,
	update: isNotAuthor,
	remove: isNotOwner
});
*/
