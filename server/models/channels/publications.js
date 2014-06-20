Meteor.publish("singleChannel", function (idOrTitle) {
	var selector = CollectionSelector.ChannelAllowedUsers(idOrTitle, this.userId);
	return Channels.find(selector);
});
