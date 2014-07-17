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
		// The channel must exist
		if (!channel) {
			throw new Meteor.Error("Bad request");
		}

		// Check if the user is allowed to add an entry
		if (!PermissionsEnum.Channels.userHasAccess(user, channel)) {
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
	}

});
