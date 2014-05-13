Meteor.methods({
	sendLinkedInProfileUrl: function (url) {
		var user = Meteor.user();
		var body = "";
		if (!user) {
			body += "New anonymous job application.\n";
			body += "LinkedIn profile url: " + url;
		} else {
			body += "New job application from:\n";
			body += user.twitterProfile.name + "\n";
			body += "@" + user.twitterProfile.screenName + "\n";
			body += (user.profile.email || "No email was provided") + "\n";
			body += "LinkedIn profile url: " + url;
		}
		var email = {
			from: "apply@pscanf.com",
			to: "paolo.scanferla@gmail.com",
			subject: "Job Application",
			text: body
		};
		Email.send(email);
	}
});
