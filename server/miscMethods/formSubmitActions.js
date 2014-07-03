var formSubmitActions = {};

formSubmitActions.sendEmailTo = {
	description: {
		label: "Send email to",
		methodName: "formSubmitActions.sendEmailTo",
		parameters: [
			{
				label: "Recipient",
				type: "text"
			},
			{
				label: "Subject",
				type: "text"
			},
			{
				label: "Body",
				type: "textarea"
			}
		]
	},
	method: function (form, recipient, subject, body) {
		var templateSettings = {
			interpolate: /\{\{(.+?)\}\}/g
		};
		if (!/^[\w\.]+@mondora\.com$/g.test(recipient)) {
			throw new Meteor.Error("Bad request");
		}
		var text;
		try {
			text = _.template(body, form, templateSettings);
		} catch (e) {
			text = body + "\n\n" + JSON.stringify(form, null, 4);
		}
		var email = {
			from: process.env.SENDER_EMAIL,
			to: recipient,
			subject: subject,
			text: text
		};
		Email.send(email);
	}
};

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
			userId: "anon",
			participants: recipients,
			name: name,
			description: text,
			tags: tags,
			status: "todo",
			date: Date.now(),
			addedOn: Date.now(),
			addedBy: {
				userId: "anon",
				name: "anon"
			},
			pomodoros: createPomodoros(eta)
		};

		Tasks.insert(task);

	}
};

Meteor.methods({
	// Define all methods
	"formSubmitActions.sendEmailTo": formSubmitActions.sendEmailTo.method,
	"formSubmitActions.addTaskTo": formSubmitActions.addTaskTo.method,
	// API for listing available actions
	getFormSubmitActions: function () {
		return _.map(formSubmitActions, function (action) {
			return action.description;
		});
	}
});
