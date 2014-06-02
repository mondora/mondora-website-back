Meteor.methods({

	startPomodoro: function (pomodoroId) {
		var event = {
			time: Date.now(),
			userId: Meteor.userId(),
			action: "start"
		};
		var selector = {
			_id: pomodoroId,
			status: "paused"
		};
		var modifier = {
			$addToSet: {
				events: event
			},
			$set: {
				status: "running"
			}
		};
		Pomodoros.update(selector, modifier);
	},

	pausePomodoro: function (pomodoroId) {
		var event = {
			time: Date.now(),
			userId: Meteor.userId(),
			action: "pause"
		};
		var selector = {
			_id: pomodoroId,
			status: "running"
		};
		var modifier = {
			$addToSet: {
				events: event
			},
			$set: {
				status: "paused"
			}
		};
		Pomodoros.update(selector, modifier);
	},

	stopPomodoro: function (pomodoroId) {
		var event = {
			time: Date.now(),
			userId: Meteor.userId(),
			action: "stop"
		};
		var selector = {
			_id: pomodoroId,
			userId: Meteor.userId(),
			status: {
				$ne: "stopped"
			}
		};
		var modifier = {
			$addToSet: {
				events: event
			},
			$set: {
				status: "stopped"
			}
		};
		Pomodoros.update(selector, modifier);
	},

	addPomodoroParticipant: function (pomodoroId, participantId) {
		var participantUser = Meteor.users.findOne(participantId);
		if (!participantUser) {
			throw new Meteor.Error("No such user");
		}
		var participant = {
			userId: participantUser._id,
			name: participantUser.profile.name,
			screenName: participantUser.profile.screenName,
			pictureUrl: participantUser.profile.pictureUrl
		};
		var selector = {
			_id: pomodoroId,
			userId: Meteor.userId(),
			status: {
				$ne: "stopped"
			}
		};
		var modifier = {
			$addToSet: {
				participants: participant
			}
		};
		Pomodoros.update(selector, modifier);
	},

	setPomodoroDuration: function (pomodoroId, duration) {
		var selector = {
			_id: pomodoroId,
			status: {
				$ne: "stopped"
			}
		};
		var modifier = {
			$set: {
				duration: duration
			}
		};
		Pomodoros.update(selector, modifier);
	}

});
