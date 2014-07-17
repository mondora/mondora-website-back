Channels.after.insert(function (userId, channel) {
	NotificationChannels.insert({
		name: "channel:" + channel._id,
		permissions: channel.permissions || {}
	});
});

Channels.after.update(function (userId, channel, fields) {
	if (_.contains(fields, "permissions")) {
		var selector = {
			name: "channel:" + channel._id
		};
		var modifier = {
			$set: {
				permissions: channel.permissions
			}
		};
		NotificationChannels.update(selector, modifier);
	}
}, {fetchPrevious: false});

Channels.after.remove(function (userId, channel) {
	var selector = {
		name: "channel:" + channel._id
	};
	NotificationChannels.remove(selector);
});
