// Ownership
var isOwner = function (userId, channel) {
	return channel.userId === userId;
};
var isNotOwner = function (userId, channel) {
	return !isOwner(userId, channel);
};

// Curatorship
var isCurator = function (userId, channel) {
	var isCurator = false;
	_.forEach(channel.curators, function (curator) {
		if (curator.userId === userId) {
			isCurator = true;
		}
	});
	return isCurator;
};
var isNotCurator = function (userId, channel) {
	return !isCurator(userId, channel);
};

Meteor.publish("singleChannel", function (channelId) {
	var user = Meteor.users.findOne(this.userId);
	var channel = Channels.findOne(channelId);
	if (!user && !channel.public) {
		throw new Meteor.Error("Login required");
	}
	// Ensure the user is allowed in the channel
	if (
		user &&
		isNotOwner(user._id, channel) &&
		isNotCurator(user._id, channel) &&
		_.intersection(user.groups, channel.groups).length === 0 &&
		! _.contains(channel.members, user._id)
	) {
		throw new Meteor.Error("Unauthorized");
	}
	return Channels.find({_id: channelId});
});
