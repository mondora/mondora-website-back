Meteor.startup(function () {

	var templateSettings = {
		interpolate: /\{\{(.+?)\}\}/g
	};

	var emailTemplates = Configurations.findOne({name: "signupEmailTemplates"});

	if (emailTemplates) {
		if (emailTemplates.siteName) {
			Accounts.emailTemplates.siteName = emailTemplates.siteName;
		}

		if (emailTemplates.from) {
			Accounts.emailTemplates.from = emailTemplates.from;
		}

		if (emailTemplates.verifyEmail) {
			if (emailTemplates.verifyEmail.subject) {
				Accounts.emailTemplates.verifyEmail.subject = function (user) {
					return _.template(
							emailTemplates.verifyEmail.subject,
							{user: user},
							templateSettings
						);
				};
			}

			if (emailTemplates.verifyEmail.text) {
				Accounts.emailTemplates.verifyEmail.text = function (user, url) {
					var token = _.last(url.split("/"));
					return _.template(
							emailTemplates.verifyEmail.text,
							{user: user, token: token},
							templateSettings
						);
				};
					
			}
		}
	}

});
