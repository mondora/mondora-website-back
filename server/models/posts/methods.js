var isNotAuthor = function (userId, post) {
	var isAuthor = false;
	_.forEach(post.authors, function (author) {
		if (author.userId === userId) {
			isAuthor = true;
		}
	});
	return !isAuthor;
};

var AVERAGE_READING_SPEED_IN_WPM = 250;

var calculateReadingLength = function (body) {
	var strippedText = body.replace(/(<([^>]+)>)/ig," ");
	strippedText = strippedText.replace(/\s+/g, " ");
	var wordCount = strippedText.split(" ").length;
	var readingLength = Math.round(wordCount / AVERAGE_READING_SPEED_IN_WPM);
	return readingLength;
};

var readabilityBaseUrl = "https://www.readability.com/api/content/v1/parser?";
var readabilityToken = process.env.READABILITY_TOKEN;

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
		comment.userScreenName = user.profile.screenName;
		comment.userName = user.profile.name;
		comment.userPictureUrl = user.profile.pictureUrl;
		comment.publishedOn = Date.now();
		comment.approved = false;
		// Avoid possible spoofing of approval
		delete comment.approvedOn;
		// Perform the insertion 
		Posts.update({_id: postId}, {$addToSet: {comments: comment}});
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
		Posts.update({_id: postId}, modifier);
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
			return {
				_id: post._id,
				title: post.title,
				subtitle: post.subtitle,
				author: {
					_id: post.authors[0].userId,
					name: post.authors[0].name,
					pictureUrl: post.authors[0].pictureUrl
				},
				readingLength: calculateReadingLength(post.body)
			};
		});
		topic.map = {
			text: name
		};
		// Build the map
		topic.map.children = posts.map(function (post) {
			return {
				text: post.title,
				href: "/#!/post/" + post._id
			};
		});
		return topic;
	},



	/////////////////////////
	// getPostsBy* methods //
	/////////////////////////

	getPostsByAuthor: function (userId) {
		var selector = {
			// Select only published posts
			published: true,
			// Authored by userId
			"authors": {
				$elemMatch: {
					userId: userId
				}
			}
		};
		var posts = Posts.find(selector).fetch();
		return posts.map(function (post) {
			return {
				_id: post._id,
				title: post.title,
				subtitle: post.subtitle,
				readingLength: calculateReadingLength(post.body)
			};
		});
	},



	/////////////////////////////////
	// Parse post with readability //
	/////////////////////////////////

	parseWithReadability: function (url) {
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Unauthorized");
		}
		var uri = readabilityBaseUrl + "url=" + url + "&token=" + readabilityToken;
		return HTTP.get(uri).data;
	}

});
