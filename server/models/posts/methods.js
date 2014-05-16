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
	},

	/////////////////////////////
	// Authors related methods //
	/////////////////////////////

	// TODO: planned for future sprints



	////////////////////////////
	// Topics related methods //
	////////////////////////////

	getTopic: function (name) {
		var selector = {
			// Select only published posts
			published: true,
			// Which have "name" as text of a first level children
			"map.children": {
				$elemMatch: {
					text: {
						$regex: new RegExp(name, "i")
					}
				}
			}
		};
		var posts = Posts.find(selector).fetch();
		// Topic object which will be returned
		var topic = {};
		topic.name = name;
		topic.imageUrl = posts[0] && posts[0].titleImageUrl;
		// Collect all summaries
		topic.posts = posts.map(function (post) {
			var strippedText = post.body.replace(/(<([^>]+)>)/ig," ");
			strippedText = strippedText.replace(/\s+/g, " ");
			var wordCount = strippedText.split(" ").length;
			var averageReadingSpeedInWpm = 250;
			var readingLength = Math.round(wordCount / averageReadingSpeedInWpm);
			return {
				_id: post._id,
				title: post.title,
				subtitle: post.subtitle,
				author: {
					_id: post.authors[0].userId,
					name: post.authors[0].name,
					pictureUrl: post.authors[0].pictureUrl
				},
				readingLength: readingLength
			};
		});
		topic.map = {
			text: name
		};
		// Build the map
		topic.map.children = posts.map(function (post) {
			return {
				text: post.title,
				href: "/#/post/" + post._id
			};
		});
		return topic;
	}

});
