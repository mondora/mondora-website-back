Meteor.methods({
	insertEvent: function (events) {
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		if (!PermissionsEnum.Events.isInRoleEvents(user._id)) {
			throw new Meteor.Error("Unauthorized");
		}
		if (!_.isArray(events)) {
			events = [events];
		}
		events = events
			.map(function (event) {
				event.day = moment(event.day).utc().startOf("day").valueOf();
				console.log(moment(event.day).utc().format());
				return event;
			})
			.filter(function (event) {
				return Events.find({
					day: event.day
				}).count() === 0;
			})
			.forEach(function (event) {
				Events.insert(event);
			});
	}
});
