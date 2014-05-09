Meteor.publish("userTwitterProfile", function () {
	var selector = {
		_id: this.userId
	};
	var options = {
		fields: {
			twitterProfile: 1
		}
	};
	return Meteor.users.find(selector, options);
});
