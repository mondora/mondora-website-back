Meteor.publish("notifications", function () {
	var selector = {
		userId: this.userId
	};
	return Notifications.find(selector);
});
