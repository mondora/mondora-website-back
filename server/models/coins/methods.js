Meteor.methods({
	insertCoin: function (coin) {
		var user = Meteor.user();
		if (!user) {
			throw new Meteor.Error("Login required");
		}
		if (!PermissionsEnum.Coins.isInRoleCoins(user._id)) {
			throw new Meteor.Error("Unauthorized");
		}
		coin.userId = user._id;
		coin.day = moment(coin.day).valueOf();
		var existing = Coins.findOne({
			day: coin.day
		});
		if (existing) {
			throw new Meteor.Error("Coin already exists");
		}
		coin.activities.forEach(function (activity) {
			var count = Projects.find({_id: activity.projectId}).count();
			if (count !== 1) {
				throw new Meteor.Error("Project not found");
			}
		});
		Coins.insert(coin);
	}
});
