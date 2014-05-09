Meteor.methods({

	//////////////////////////////
	// Comments related methods //
	//////////////////////////////

	addCommentToPost: function (postId, comment) {
		// Only allow logged in users to comment
		if (!Meteor.userId()) {
			throw new Meteor.Error("Login required");
		}
		// Set the userId (this also prevents comment spoofing)
		comment.userId = Meteor.userId();
		// Set the _id
		comment._id = Random.id();
		// Set the published date
		comment.publishedOn = Date.now();
		// Avoid spoofing approval
		delete comment.approved;
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
		var isAuthor = isNotAuthor(Meteor.userId(), post);
		if (!isAuthor) {
			throw new Meteor.Error("Not authorized");
		}
		var selector = {
			_id: postId,
			"comments._id": commentId
		};
		var modifier = {
			$set: {
				"comments.$.public": true
			}
		};
		// Perform the update
		Posts.update(selector, modifier);
	}

	/////////////////////////////
	// Authors related methods //
	/////////////////////////////

	// TODO



});
