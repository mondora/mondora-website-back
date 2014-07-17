Meteor.methods({



	addPomodoroEvent: function (taskId, pomodoroId, event) {
		var user = Meteor.user() || {};

		var prevStatus;
		var nextStatus;
		switch (event.action) {
			case "start":
				prevStatus = ["pristine", "paused"];
				nextStatus = "running";
				break;
			case "pause":
				prevStatus = ["running"];
				nextStatus = "paused";
				break;
			case "stop":
				prevStatus = ["running"];
				nextStatus = "done";
				break;
			case "abort":
				prevStatus = ["pristine", "running", "paused"];
				nextStatus = "aborted";
				break;
		}

		var selector = {
			$and: [
				{
					_id: taskId
				},
				PermissionsEnum.Tasks.getSelector(user._id)
			],
			"pomodoros._id": pomodoroId,
			"pomodoros.status": {
				$in: prevStatus
			}
		};
		var modifier = {
			$addToSet: {
				"pomodoros.$.events": _.extend(event, {
					userId: user._id,
					time: Date.now()
				})
			},
			$set: {
				"pomodoros.$.status": nextStatus
			}
		};
		Tasks.update(selector, modifier);
	},



	setPomodoroDuration: function (taskId, pomodoroId, duration) {

	}



});
