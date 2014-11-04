Router.map(function () {

	this.route("presences", {
		where: "server",
		action: function () {
			var date = moment.utc({
				month: parseInt(this.request.query.month, 10),
				year: parseInt(this.request.query.year, 10)
			});
			var startOfMonth = date.startOf("month").valueOf();
			var endOfMonth = date.endOf("month").valueOf();
			var presences = Meteor.users.find({
				roles: {
					$in: ["mondora"]
				}
			}).map(function (user) {
				var days = Coins.find({
					userId: user._id,
					day: {
						$gte: startOfMonth,
						$lte: endOfMonth
					}
				}).map(function (coin) {
					var timeSpent = coin.activities.reduce(function (acc, activity) {
						return (acc + activity.timeSpent);
					}, 0);
					return {
						day: coin.day,
						timeSpent: timeSpent
					};
				});
				return {
					user: {
						name: user.profile.name,
						email: user.emails[0].address
					},
					days: days
				};
			});
			this.response.writeHead(200);
			this.response.end(
				JSON.stringify(presences)
			);
		}
	});

});

