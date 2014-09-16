Router.map(function () {
	this.route("courtesyForm", {
		where: "server",
		action: function () {
			var emailAddress = this.request.body.email;
			var fullName = this.request.body.name;

			var body = "";
			body += "A person entered the courtesy contest!\n";
			body += "Name: " + fullName + "\n";
			body += "Email: " + emailAddress + "\n";
			var email = {
				from: "contest@mondora.com",
				to: "paolo.scanferla@mondora.com",
				subject: "Someone entered the courtesy contest!",
				text: body
			};
			Email.send(email);

			HouseFile.insert({
				name: fullName,
				email: emailAddress,
				origin: "courtesyContest"
			});

			this.response.writeHead(200);
			this.response.end();
		}
	});
});
