var assert = require("assert");

suite("Posts Methods", function () {

	test("the likePost method adds the id of the user who liked the post to the likedBy property", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Posts.insert({
				_id: "abcThisIsTheId",
				userId: Random.id(),
				published: true,
				publishedOn: new Date("07-18-2013").getTime(),
				permissions: {
					public: true
				}
			});
			emit("fixturesInserted");
		});
		server.on("fixturesInserted", function () {
			client.eval(function () {
				Meteor.loginWithPassword("a@a.com", "123456", function() {
					Meteor.call("likePost", "abcThisIsTheId", function () {
						emit("result");
					});
				});
			});
		});
		client.on("result", function (actual) {
			server.eval(function () {
				var user = Meteor.users.findOne();
				var post = Posts.findOne({_id: "abcThisIsTheId"});
				emit("testResults", user, post);

			});
		});
		server.on("testResults", function (user, post) {
			assert.equal(post.likedBy.length, 1);
			assert.equal(post.likedBy[0], user._id);
			done();
		});
	});

	test("the unlikePost method removes the id of the user who liked the post from the likedBy property", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({
				email: "a@a.com",
				password: "123456"
			});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "abcThisIsTheId",
				userId: Random.id(),
				published: true,
				publishedOn: new Date("07-18-2013").getTime(),
				permissions: {
					public: true
				},
				likedBy: [userId]
			});
			emit("fixturesInserted");
		});
		server.on("fixturesInserted", function () {
			client.eval(function () {
				Meteor.loginWithPassword("a@a.com", "123456", function() {
					Meteor.call("unlikePost", "abcThisIsTheId", function () {
						emit("result");
					});
				});
			});
		});
		client.on("result", function (actual) {
			server.eval(function () {
				var post = Posts.findOne({_id: "abcThisIsTheId"});
				emit("testResults", post);

			});
		});
		server.on("testResults", function (post) {
			assert.equal(post.likedBy.length, 0);
			done();
		});
	});

});
