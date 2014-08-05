Meteor.methods({

	addUserLog: function (details) {
		UserLogs.insert({
			userId: Meteor.userId() || "anonymous",
			date: Date.now(),
			details: details
		});
	}

});
