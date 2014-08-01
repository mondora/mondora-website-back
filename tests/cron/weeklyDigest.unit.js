var assert = require("assert");

suite("Weekly digest", function () {

	test("the Cron.sendWeeklyDigest function sends an email to each user", function (done, server, client) {
		
		server.eval(function () {

			var daysInMs = function (n) {
				var ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
				return n * ONE_DAY_IN_MS;
			};

			////////////////////////
			// Create dummy posts //
			////////////////////////

			Posts.insert({
				_id: "1",
				userId: Random.id(),
				published: true,
				publishedOn: Date.now() - daysInMs(4),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				_id: "2",
				userId: Random.id(),
				published: true,
				publishedOn: Date.now() - daysInMs(5),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				_id: "3",
				userId: Random.id(),
				published: false,
				publishedOn: Date.now() - daysInMs(6),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				_id: "4",
				userId: Random.id(),
				published: true,
				publishedOn: Date.now() - daysInMs(3),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				_id: "5",
				userId: Random.id(),
				published: true,
				publishedOn: Date.now() - daysInMs(8),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				_id: "6",
				userId: Random.id(),
				published: false,
				publishedOn: Date.now() - daysInMs(4),
				permissions: {
					public: true
				}
			});

			////////////////////////
			// Create dummy users //
			////////////////////////

			Accounts.createUser({email: "a@pscanf.com", password: "123456"});
			Accounts.createUser({email: "b@pscanf.com", password: "123456"});
			Accounts.createUser({email: "c@pscanf.com", password: "123456"});
			Accounts.createUser({email: "d@pscanf.com", password: "123456"});
			Accounts.createUser({email: "e@pscanf.com", password: "123456"});
			Meteor.users.update({
				"emails.verified": false
			}, {
				$set: {
					"emails.$.verified": true
				}
			}, {
				multi: true
			});

			var emails = [];

			var tmp = Email.send;

			Email.send = function (email) {
				emails.push(email);
			};

			Cron.sendWeeklyDigest();
			emit("result", emails);

			Email.send = tmp;

		});

		server.on("result", function (emails) {
			assert.equal(emails.length, 5);
			var aUserEmail = emails.reduce(function (acc, email) {
				if (acc) {
					return acc;
				}
				if (email.to === "a@pscanf.com") {
					return email;
				}
				return false;
			}, false);
			var expectedLinks = [
				"https://mondora.com/#!/post/1",
				"https://mondora.com/#!/post/2",
				"https://mondora.com/#!/post/4"
			].sort().join("");
			var actualLinks = aUserEmail.text.split("\n").slice(0, -1).sort().join("");
			assert.equal(expectedLinks, actualLinks);
			done();
		});

	});

});
