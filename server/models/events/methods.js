Meteor.methods({
	insertEvent: function (events) {
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		if (!PermissionsEnum.Coins.isInRoleEvents(user._id)) {
			throw new Meteor.Error("Unauthorized");
		}
		if (!_.isArray(events)) {
			events = [events];
		}
		events.forEach(function (event) {
			event.day = moment(event.day).utc().startOf("day").valueOf();
		});
		Events.insert(events);
	}
});
