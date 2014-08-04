/////////////////////////
// Posts API (methods) //
/////////////////////////

Meteor.methods({



	////////////////////////////
	// Method to add comments //
	////////////////////////////

	addCommentToPost: function (postId, comment) {

		// Get the user
		var user = Meteor.user();
		// Only allow logged in users to comment
		if (!user) {
			throw new Meteor.Error("Login required");
		}

		// Get the post
		var post = Posts.findOne({_id: postId});
		// The post must exist
		if (!post) {
			throw new Meteor.Error("Bad request");
		}

		// Check if the user is allowed to comment
		if (!PermissionsEnum.Posts.userHasAccess(user, post)) {
			throw new Meteor.Error("Not allowed");
		}

		// Complete the comment (this also prevents comment spoofing)
		comment._id = Random.id();
		comment.userId = user._id;
		comment.userScreenName = user.profile.screenName;
		comment.userName = user.profile.name;
		comment.userPictureUrl = user.profile.pictureUrl;
		comment.publishedOn = Date.now();
		comment.approved = false;
		delete comment.approvedOn;

		// Perform the insertion 
		Posts.update({_id: postId}, {$addToSet: {comments: comment}});

		// Notify the authors of the comment
		post.authors.forEach(function (author) {
			if (author.userId === user._id) {
				return;
			}
			var notification = {
				channel: "user:" + author.userId,
				type: "commentToPost",
				details: {
					postId: post._id,
					postTitle: post.title,
					from: {
						userId: user._id,
						name: user.profile.name,
						screenName: user.profile.screenName,
						pictureUrl: user.profile.pictureUrl
					}
				},
				date: Date.now()
			};
			Notifications.insert(notification);
		});

		// If the commenter is an author, publish his comment
		if (PermissionsEnum.Posts.isAuthor(user._id, post)) {
			Meteor.call("publishCommentOfPost", post._id, comment._id);
		}

	},



	deleteCommentFromPost: function (postId, commentId) {
		var FIVE_MINUTES = 5 * 60 * 1000;
		var modifier = {
			$pull: {
				comments: {
					_id: commentId,
					// Don't allow users to remove other users comments
					userId: Meteor.userId(),
					// Deleting comments is only allowed within
					// 5 minutes from the publication
					/* DOES NOT WORK. METEOR BUG?
					publishedOn: {
						$gt: Date.now() - FIVE_MINUTES
					}
					*/
				}
			}
		};
		Posts.update({_id: postId}, modifier);
	},



	publishCommentOfPost: function (postId, commentId) {

		// Get the post
		var post = Posts.findOne(postId);

		// Get the comment
		var comment = post.comments.reduce(function (acc, cur) {
			if (acc) return acc;
			if (cur._id === commentId) return cur;
		}, false);
		// Get the commenter
		var commenter = Meteor.users.findOne({_id: comment.userId});

		// Only allow authors to publish comments
		if (PermissionsEnum.Posts.isNotAuthor(Meteor.userId(), post)) {
			throw new Meteor.Error("Not authorized");
		}

		// Construct the selector and the modifier
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
		
		// Scan for user mentions and notify the users
		var userMentions = comment.text.match(/@\w+/g);
		if (userMentions) {
			userMentions.forEach(function (userScreenName) {
				var user = Meteor.users.findOne({"profile.screenName": userScreenName.slice(1)});
				if (!user) {
					return;
				}
				// Check if the user has access to the post. If he doesn't, don't
				// notify him
				if (!PermissionsEnum.Posts.userHasAccess(user, post)) {
					return;
				}
				var notification = {
					channel: "user:" + user._id,
					type: "mentionInComment",
					details: {
						postId: post._id,
						postTitle: post.title,
						from: {
							userId: commenter._id,
							name: commenter.profile.name,
							screenName: commenter.profile.screenName,
							pictureUrl: commenter.profile.pictureUrl
						}
					},
					date: Date.now()
				};
				Notifications.insert(notification);
			});
		}

		// Scan for channel mentions and add entries to said channels
		var channelMentions = comment.text.match(/#\w+/g);
		if (channelMentions) {
			channelMentions.forEach(function (mention) {
				var channel = Channels.findOne({name: mention.slice(1)});
				var entry = {
			 		type: "comment",
					content: {
						postId: post._id,
						postTitle: post.title,
						text: comment.text,
						anchor: comment.anchor
					}
				};
				// Add entry
				ServerMethods.Channels.addEntryToChannelFromUser(channel, entry, commenter);
			});
		}

	},



	//////////////////////////
	// Like-related methods //
	//////////////////////////

	likePost: function (postId) {
		var user = Meteor.user();
		if (!user) {
			return;
		}
		var selector = {
			$and: [
				{
					_id: postId,
					published: true
				},
				PermissionsEnum.Posts.getPermissionsSelector(user)
			]
		};
		var modifier = {
			$addToSet: {
				likedBy: user._id
			}
		};
		Posts.update(selector, modifier);
	},

	unlikePost: function (postId) {
		var user = Meteor.user();
		if (!user) {
			return;
		}
		var selector = {
			$and: [
				{
					_id: postId,
					published: true
				},
				PermissionsEnum.Posts.getPermissionsSelector(user)
			]
		};
		var modifier = {
			$pull: {
				likedBy: user._id
			}
		};
		Posts.update(selector, modifier);
	},



	///////////////////////////
	// Recommendation method //
	///////////////////////////

	recommendPost: function (postId, userId, message) {
		// Check arguments
		check(postId, String);
		check(userId, String);
		check(message, Match.Optional(String));
		// Only allow logged-in users to call this method
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Check the post exists
		var post = Posts.findOne({_id: postId});
		if (!post) {
			throw new Meteor.Error("Post doesn't exist");
		}
		// Check the target user exists
		var targetUser = Meteor.users.findOne({_id: userId});
		if (!targetUser) {
			throw new Meteor.Error("Target user doesn't exist");
		}
		// Check that both users have access to the post
		if (
			!PermissionsEnum.Posts.userHasAccess(user, post) ||
			!PermissionsEnum.Posts.userHasAccess(targetUser, post)
		) {
			throw new Meteor.Error("Unauthorized");
		}
		// Construct and send the notification
		var notification = {
			channel: "user:" + userId,
			type: "postRecommendation",
			details: {
				postId: post._id,
				postTitle: post.title,
				from: {
					userId: user._id,
					name: user.profile.name,
					screenName: user.profile.screenName,
					pictureUrl: user.profile.pictureUrl
				},
				message: message
			},
			date: Date.now()
		};
		Notifications.insert(notification);
	},



	/////////////////////////
	// Notification method //
	/////////////////////////

	notifyNewPost: function (postId) {
		var post = Posts.findOne({_id: postId});
		if (
			post &&
			post.published &&
			post.permissions.public &&
			PermissionsEnum.Posts.isOwner(Meteor.userId(), post)
		) {
			var notification = {
				channel: "post:newPublic",
				type: "newPost",
				details: {
					postId: post._id,
					postTitle: post.title,
					from: post.authors[0]
				},
				date: Date.now()
			};
			Notifications.insert(notification);
		}
	},



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



	/////////////////////////////////
	// Parse post with readability //
	/////////////////////////////////

	parseWithReadability: function (url) {
		var readabilityBaseUrl = "https://www.readability.com/api/content/v1/parser?";
		var readabilityToken = process.env.READABILITY_TOKEN;
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Unauthorized");
		}
		var uri = readabilityBaseUrl + "url=" + url + "&token=" + readabilityToken;
		return HTTP.get(uri).data;
	}



});
