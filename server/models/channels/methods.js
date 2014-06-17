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

Meteor.methods({

	///////////////////////////
	// Entry related methods //
	///////////////////////////

	addEntryToChannel: function (channelId, entry) {
		var user = Meteor.user();
		var channel = Channels.findOne(channelId);
		// Only allow logged in users to add an entry
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Ensure the user is allowed in the channel
		// A channel has two ways to manage permissions:
		// groups and members. Also allow owners and curators
		// to add entries.
		if (
			isNotOwner(user._id, channel) &&
			isNotCurator(user._id, channel) &&
			_.intersection(user.groups, channel.groups).length === 0 &&
			! _.contains(channel.members, user._id)
		) {
			throw new Meteor.Error("Unauthorized");
		}
		// Set properties (this also prevents entry spoofing)
		entry._id = Random.id();
		entry.userId = user._id;
		entry.userScreenName = user.profile.screenName;
		entry.userName = user.profile.name;
		entry.userPictureUrl = user.profile.pictureUrl;
		entry.publishedOn = Date.now();
		// Perform the insertion 
		Channels.update(channelId, {$addToSet: {entries: entry}});
	},

	addEntryToChannelByTitle: function (title, entry) {
		var user = Meteor.user();
		var channel = Channels.findOne({title: title});
		if (!channel) {
			throw new Meteor.Error("Channel " + title + " does not exist");
		}
		// Only allow logged in users to add an entry
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Ensure the user is allowed in the channel
		// A channel has two ways to manage permissions:
		// groups and members. Also allow owners and curators
		// to add entries.
		if (
			isNotOwner(user._id, channel) &&
			isNotCurator(user._id, channel) &&
			_.intersection(user.groups, channel.groups).length === 0 &&
			! _.contains(channel.members, user._id)
		) {
			throw new Meteor.Error("Unauthorized");
		}
		// Set properties (this also prevents entry spoofing)
		entry._id = Random.id();
		entry.userId = user._id;
		entry.userScreenName = user.profile.screenName;
		entry.userName = user.profile.name;
		entry.userPictureUrl = user.profile.pictureUrl;
		entry.publishedOn = Date.now();
		// Perform the insertion 
		Channels.update(channel._id, {$addToSet: {entries: entry}});
	},

	deleteEntryFromChannel: function (channelId, entryId) {
		var channel = Channels.findOne(channelId);
		var modifier = {
			$pull: {
				entries: {
					_id: entryId
				}
			}
		};
		if (isNotCurator(Meteor.userId(), channel)) {
			// Don't allow users to remove other users entries
			modifier.$pull.entries.userId = Meteor.userId();
		}
		Channels.update(channelId, modifier);
	}

});
