Meteor.publish("eventsByMonth", function (day) {
	var startOfMonth = moment(day).utc().startOf("month").valueOf();
	var endOfMonth = moment(day).utc().endOf("month").valueOf();
	return Events.find({
		day: {
			$gte: startOfMonth,
			$lte: endOfMonth
		}
	});
});
