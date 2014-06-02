Meteor.publish("pomodoros", function () {
	var selector = {
		participants: {
			$elemMatch: {
				userId: this.userId
			}
		},
		status: {
			$ne: "stopped"
		}
	};
	return Pomodoros.find(selector);
});

Meteor.publish("singlePomodoro", function (pomodoroId) {
	var selector = {
		_id: pomodoroId,
		participants: {
			$elemMatch: {
				userId: this.userId
			}
		}
	};
	return Pomodoros.find(selector);
});
