Meteor.methods({
	sendLinkedInProfileUrl: function (url) {
		var user = Meteor.user();
		var body = "";
		if (!user) {
			body += "New anonymous job application.\n";
			body += "LinkedIn profile url: " + url;
		} else {
			body += "New job application from:\n";
			body += user.profile.name + "\n";
			body += "@" + user.profile.screenName + "\n";
			body += (user.profile.email || "No email was provided") + "\n";
			body += "LinkedIn profile url: " + url;
		}
		var email = {
			from: "apply@mondora.com",
			to: "francesco.mondora@mondora.com",
			subject: "Job Application",
			text: body
		};
		Email.send(email);
	}
});
