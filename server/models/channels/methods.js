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

	addEntryToChannel: function (idOrTitle, entry) {
		var user = Meteor.user();
		// Only allow logged in users to add an entry
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Set properties (this also prevents entry spoofing)
		entry._id = Random.id();
		entry.userId = user._id;
		entry.userScreenName = user.profile.screenName;
		entry.userName = user.profile.name;
		entry.userPictureUrl = user.profile.pictureUrl;
		entry.publishedOn = Date.now();
		// Get the selector
		var selector = CollectionSelector.ChannelAllowedUsers(idOrTitle, user._id);
		// Perform the insertion 
		Channels.update(selector, {$addToSet: {entries: entry}});
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
