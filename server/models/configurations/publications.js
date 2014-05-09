Meteor.publish("configurations", function () {
	return Configurations.find();
});
