Meteor.publish("singlePost", function (idOrTitle) {
	var selector = CollectionSelector.PostAllowedUsers(idOrTitle, this.userId);
	return Posts.find(selector);
});
