ServerMethods.Channels = {
	addEntryToChannelFromUser: function (channel, entry, user) {
		// The channel must exist
		if (!channel) {
			throw new Meteor.Error("Bad request");
		}

		// Check if the user is allowed to add an entry
		if (!PermissionsEnum.Channels.userCanAddEntry(user, channel)) {
			throw new Meteor.Error("Not allowed");
		}

		// Complete the entry (this also prevents entry spoofing)
		entry._id = Random.id();
		entry.addedBy = {
			userId: user._id,
			screenName: user.profile.screenName,
			name: user.profile.name,
			pictureUrl: user.profile.pictureUrl
		};
		entry.publishedOn = Date.now();

		// Perform the insertion 
		Channels.update({_id: channel._id}, {$addToSet: {entries: entry}});

		// Notify
		Notifications.insert({
			channel: "channel:" + channel._id,
			type: "newEntryInChannel",
			details: {
				channelId: channel._id,
				channelName: channel.name
			},
			date: Date.now()
		});
	}
};

Meteor.methods({

	///////////////////////////
	// Entry related methods //
	///////////////////////////

	addEntryToChannel: function (idOrName, entry) {
		// Get the user
		var user = Meteor.user();
		// Only allow logged in users to add an entry
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Get the channel
		var channel = Channels.findOne({
			$or: [
				{
					_id: idOrName
				},
				{
					name: idOrName
				}
			]
		});
		// Add entry
		ServerMethods.Channels.addEntryToChannelFromUser(channel, entry, user);
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
		if (PermissionsEnum.Channels.isNotCurator(Meteor.userId(), channel)) {
			// Don't allow users to remove other users entries
			modifier.$pull.entries["addedBy.userId"] = Meteor.userId();
		}
		Channels.update(channelId, modifier);
	},

	///////////////////////////
	// Recommendation method //
	///////////////////////////

	recommendChannel: function (channelId, userId, message) {
		// Check arguments
		check(channelId, String);
		check(userId, String);
		if (message === null) {
			message = undefined;
		}
		check(message, Match.Optional(String));
		// Only allow logged-in users to call this method
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		// Check the post exists
		var channel = Channels.findOne({_id: channelId});
		if (!channel) {
			throw new Meteor.Error("Channel doesn't exist");
		}
		// Check the target user exists
		var targetUser = Meteor.users.findOne({_id: userId});
		if (!targetUser) {
			throw new Meteor.Error("Target user doesn't exist");
		}
		// Check that both users have access to the channel
		if (
			!PermissionsEnum.Channels.userHasAccess(user, channel) ||
			!PermissionsEnum.Channels.userHasAccess(targetUser, channel)
		) {
			throw new Meteor.Error("Unauthorized");
		}
		// Construct and send the notification
		var notification = {
			channel: "user:" + userId,
			type: "channelRecommendation",
			details: {
				channelId: channel._id,
				channelName: channel.commonName,
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
	}

});
