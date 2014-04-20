Meteor.publish("posts", function () {
	return Posts.find();
});
Meteor.publish("homeConfig", function () {
	return HomeConfig.find();
});
