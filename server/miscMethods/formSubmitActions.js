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
		if (/[@;]/g.test(recipient)) {
			throw new Meteor.Error("Bad request");
		}
		var text;
		try {
			text = _.template(body, form, templateSettings);
		} catch (e) {
			text = JSON.stringify(form, null, 4);
		}
		var email = {
			from: "form@pscanf.com",
			to: recipient + "@pscanf.com",
			subject: subject,
			text: text
		};
		Email.send(email);
	}
};

Meteor.methods({
	// Define all methods
	"formSubmitActions.sendEmailTo": formSubmitActions.sendEmailTo.method,
	// API for listing available actions
	getFormSubmitActions: function () {
		return _.map(formSubmitActions, function (action) {
			return action.description;
		});
	}
});
