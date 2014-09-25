Meteor.publish("coinsByUserAndMonth", function (userId, day) {
	if (!PermissionsEnum.Coins.isInRoleCoinManager(this.userId)) {
		userId = this.userId;
	}
	var startOfMonth = moment(day).utc().startOf("month").valueOf();
	var endOfMonth = moment(day).utc().endOf("month").valueOf();
	return Coins.find({
		userId: userId,
		day: {
			$gte: startOfMonth,
			$lte: endOfMonth
		}
	});
});
