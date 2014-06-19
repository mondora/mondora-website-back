Meteor.publish("singlePost", function (postId) {
	var user = Meteor.users.findOne(this.userId);
	var selector = {
		$and: [
			{
				// Find the post by this _id
				_id: postId
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
	return Posts.find(selector);
});
