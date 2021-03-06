var formSubmitActions = {};

formSubmitActions.addTaskTo = {
	description: {
		label: "Add task to",
		methodName: "formSubmitActions.addTaskTo",
		parameters: [
			{
				label: "Recipients",
				placeholder: "Add recipient",
				type: "users"
			},
			{
				label: "Name",
				type: "text"
			},
			{
				label: "Description",
				type: "textarea"
			},
			{
				label: "Estimated time (in pomodoros)",
				type: "number"
			},
			{
				label: "Tags",
				placeholder: "Add tag",
				type: "tags"
			}
		]
	},
	method: function (form, recipients, name, description, eta, tags) {

		var templateSettings = {
			interpolate: /\{\{(.+?)\}\}/g
		};

		var text;
		try {
			text = _.template(description, form, templateSettings);
		} catch (e) {
			text = description + "\n\n" + JSON.stringify(form, null, 4);
		}

		var DEFAULT_POMODORO_DURATION = 25 * 60 * 1000;
		var createPomodoros = function (n) {
			var pomodoros = [];
			for (var i=0; i<n; i++) {
				pomodoros.push({
					_id: Random.hexString(32),
					events: [],
					status: "pristine",
					duration: DEFAULT_POMODORO_DURATION
				});
			}
			return pomodoros;
		};

		var task = {
			userId: recipients[0].userId,
			participants: recipients,
			name: name,
			description: text,
			tags: tags,
			status: "todo",
			date: Date.now(),
			addedOn: Date.now(),
			pomodoros: createPomodoros(eta)
		};
		var user = Meteor.user();
		if (user) {
			task.addedBy = {
				userId: user._id,
				name: user.profile.name,
				screenName: user.profile.screenName,
				pictureUrl: user.profile.pictureUrl
			};
		} else {
			task.addedBy = {
				userId: "anonymous",
				name: "Anonymous",
				screenName: "anon",
				pictureUrl: "https://s3-eu-west-1.amazonaws.com/ngtest/9608246195130050__new-default-twitter-avatar.jpg"
			};
		}

		Tasks.insert(task);

	}
};

Meteor.methods({
	// Define all methods
	"formSubmitActions.addTaskTo": formSubmitActions.addTaskTo.method,
	// API for listing available actions
	getFormSubmitActions: function () {
		return _.map(formSubmitActions, function (action) {
			return action.description;
		});
	}
});
