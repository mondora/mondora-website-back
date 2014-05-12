var isNotAuthor = function (userId, post) {
	var isAuthor = false;
	_.forEach(post.authors, function (author) {
		if (author.userId === userId) {
			isAuthor = true;
		}
	});
	return !isAuthor;
};

Meteor.methods({

	//////////////////////////////
	// Comments related methods //
	//////////////////////////////

	addCommentToPost: function (postId, comment) {
		var user = Meteor.user();
		// Only allow logged in users to comment
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Set properties (this also prevents comment spoofing)
		comment._id = Random.id();
		comment.userId = user._id;
		comment.userScreenName = user.twitterProfile.screenName;
		comment.userName = user.twitterProfile.name;
		comment.userPictureUrl = user.twitterProfile.pictureUrl;
		comment.publishedOn = Date.now();
		comment.approved = false;
		// Avoid possible spoofing of approval
		delete comment.approvedOn;
		// Perform the insertion 
		Posts.update(postId, {$addToSet: {comments: comment}});
	},

	// TODO: allow only deleting within 5 minutes from the publication
	deleteCommentFromPost: function (postId, commentId) {
		var modifier = {
			$pull: {
				comments: {
					_id: commentId,
					// Don't allow users to remove other users comments
					userId: Meteor.userId()
				}
			}
		};
		Posts.update(postId, modifier);
	},

	// TODO: refactor to perform the update in just one Mongo query
	publishCommentOfPost: function (postId, commentId) {
		var post = Posts.findOne(postId);
		// Only authors can publish comments
		if (isNotAuthor(Meteor.userId(), post)) {
			throw new Meteor.Error("Not authorized");
		}
		var selector = {
			_id: postId,
			"comments._id": commentId
		};
		var modifier = {
			$set: {
				"comments.$.approved": true,
				"comments.$.approvedOn": Date.now()
			}
		};
		// Perform the update
		Posts.update(selector, modifier);
	}

	/////////////////////////////
	// Authors related methods //
	/////////////////////////////

	// TODO: planned for future sprints



});
