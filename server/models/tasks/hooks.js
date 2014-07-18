Tasks.after.update(function (userId, task) {
	var before = _.pluck(this.previous.participants, "userId");
	var after = _.pluck(task.participants, "userId");
	var diff = _.difference(after, before);
	_.forEach(diff, function (userId) {
		var notification = {
			channel: "user:" + userId,
			type: "taskAdded",
			details: {
				taskId: task._id,
				taskName: task.name,
				from: task.addedBy
			},
			date: Date.now()
		};
		Notifications.insert(notification);
	});
});

Tasks.after.insert(function (userId, task) {
	var participantIds = _.pluck(task.participants, "userId");
	_.forEach(participantIds, function (userId) {
		if (userId === task.addedBy.userId) {
			return;
		}
		var notification = {
			channel: "user:" + userId,
			type: "taskAdded",
			details: {
				taskId: task._id,
				taskName: task.name,
				from: task.addedBy
			},
			date: Date.now()
		};
		Notifications.insert(notification);
	});
});
