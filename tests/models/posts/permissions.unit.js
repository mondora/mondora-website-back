var assert = require("assert");

suite("Posts Permissions", function() {





	////////////////////////
	// Insert permissions //
	////////////////////////

	test("insert denied for not logged in users", function (done, server, client) {

		// Setup
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
		});

		// Test
		client.eval(function () {
			Posts.find().observe({
				removed: function (doc) {
					emit("remove", doc);
				}
			});
			Posts.insert({userId: "justAStubToBypassValidation"});
		});

		client.on("remove", function (doc) {
			assert.equal(doc.userId, "justAStubToBypassValidation");
			done();
		});

	});

	test("insert denied for users not in role \"blog\"", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				emit("login");
			});
		});

		// Test
		client.on("login", function () {
			client.eval(function () {
				Posts.find().observe({
					removed: function (doc) {
						emit("remove", doc, Meteor.userId());
					}
				});
				Posts.insert({userId: Meteor.userId()});
			});
		});

		client.on("remove", function (doc, id) {
			assert.equal(doc.userId, id);
			done();
		});

	});

	test("insert allowed for users in role \"blog\"", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Meteor.users.update({}, {$set: {roles: ["blog"]}});
			emit("created");
		});

		server.once("created", function () {
			server.eval(function () {
				Posts.find().observe({
					added: function (doc) {
						emit("added", doc);
					}
				});
				emit("observing");
			});
		});

		// Test
		server.once("observing", function () {
			client.eval(function () {
				Posts = new Meteor.Collection("posts");
				Meteor.loginWithPassword("a@a.com", "123456", function() {
					emit("login");
				});
			});
		});

		client.on("login", function () {
			client.eval(function () {
				Posts.insert({userId: Meteor.userId(), title: "Hello!"});
			});
		});

		server.once("added", function (doc) {
			assert.equal(doc.title, "Hello!");
			done();
		});

	});

	test("userId spoofing on insert denied", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				emit("login");
			});
		});

		// Test
		client.on("login", function () {
			client.eval(function () {
				Posts.find().observe({
					removed: function (doc) {
						emit("remove", doc, Meteor.userId());
					}
				});
				Posts.insert({userId: "notThisUsersId"});
			});
		});

		client.on("remove", function (doc, id) {
			assert.equal(doc.userId, "notThisUsersId");
			done();
		});

	});





	////////////////////////
	// Update permissions //
	////////////////////////

	test("update disallowed for not logged in users", function (done, server, client) {

		// Setup
		server.eval(function () {
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				published: true
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.subscribe("singlePost", "postId");
			Posts.find().observe({
				added: function (doc) {
					emit("added", doc);
				}
			});
		});

		// Test
		client.on("added", function () {
			client.eval(function () {
				Posts.update({_id: "postId"}, {$set: {published: false}}, function (err) {
					emit("updateResult", err);
				});
			});
		});

		client.on("updateResult", function (err) {
			if (err) {
				done();
			} else {
				done("No errors, expected one");
			}
		});

	});

	test("updating disallowed for non-owners and non-authors", function (done, server, client) {

		// Setup
		server.eval(function () {
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				published: true
			});
			Accounts.createUser({email: "a@a.com", password: "123456"});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Meteor.subscribe("singlePost", "postId");
				Posts.find().observe({
					added: function (doc) {
						emit("added", doc);
					}
				});
			});
		});

		// Test
		client.once("added", function () {
			client.eval(function () {
				Posts.update({_id: "postId"}, {$set: {published: false}}, function (err) {
					emit("updateResult", err);
				});
			});
		});

		client.on("updateResult", function (err) {
			if (err) {
				done();
			} else {
				done("No errors, expected one");
			}
		});

	});

	test("updating userId disallowed for owners", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
		});

		// Test
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function () {
				var id = Posts.insert({userId: Meteor.userId()}, function () {
					Posts.update({_id: id}, {$set: {userId: "someOtherUserId"}}, function (err) {
						emit("updateResult", err);
					});
				});

			});
		});

		client.on("updateResult", function (err) {
			if (err) {
				done();
			} else {
				done("No errors, expected one");
			}
		});

	});

	test("updating userId disallowed for authors", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				authors: [{
					userId: userId
				}]
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				var id = Posts.insert({userId: Meteor.userId()}, function () {
					Posts.update({_id: id}, {$set: {userId: "someOtherUserId"}}, function (err) {
						emit("updateResult", err);
					});
				});

			});
		});

		client.on("updateResult", function (err) {
			console.log(JSON.stringify(err));
			if (err) {
				done();
			} else {
				console.log("ELSE BRANCH");
				done("No errors, expected one");
			}
		});

	});

	test("updating authors disallowed for authors", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				authors: [{
					userId: userId
				}]
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				emit("login");
			});
		});

		// Test
		client.on("login", function () {
			client.eval(function () {
				var id = Posts.insert({userId: Meteor.userId()}, function () {
					Posts.update({_id: id}, {$set: {authors: [{userId: "someOtherUserId"}]}}, function (err) {
						emit("updateResult", err);
					});
				});

			});
		});

		client.on("updateResult", function (err) {
			assert.notEqual(err, null);
			done();
		});

	});

	test("updating something else allowed for authors", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				authors: [{
					userId: userId
				}]
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				emit("login");
			});
		});

		// Test
		client.on("login", function () {
			client.eval(function () {
				var id = Posts.insert({userId: Meteor.userId()}, function () {
					Posts.update({_id: id}, {$set: {published: true}}, function (err) {
						emit("updateResult", err);
					});
				});

			});
		});

		client.on("updateResult", function (err) {
			assert.equal(err, null);
			done();
		});

	});





	////////////////////////
	// Remove permissions //
	////////////////////////

	test("removing disallowed for non-owners", function (done, server, client) {

		// Setup
		server.eval(function () {
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				published: true
			});
			Accounts.createUser({email: "a@a.com", password: "123456"});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				emit("login");
			});
		});

		// Test
		client.on("login", function () {
			client.eval(function () {
				Meteor.subscribe("singlePost", "postId");
				Posts.find().observe({
					added: function (doc) {
						emit("added", doc);
					}
				});
			});
		});

		client.once("added", function () {
			client.once("added", function (restoredDoc) {
				assert.equal(restoredDoc._id, "postId");
				done();
			});
			client.eval(function () {
				Posts.remove("postId");
			});
		});

	});


	test("remove allowed for owners", function (done, server, client) {

		// Setup
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Meteor.users.update({}, {$set: {roles: ["blog"]}});
			emit("created");
		});

		server.once("created", function () {
			server.eval(function () {
				Posts.find().observe({
					removed: function (doc) {
						emit("removed", doc);
					}
				});
				emit("observing");
			});
		});

		server.once("observing", function () {
			client.eval(function () {
				Posts = new Meteor.Collection("posts");
				Meteor.loginWithPassword("a@a.com", "123456", function() {
					emit("login");
				});
			});
		});

		// Test
		client.on("login", function () {
			client.eval(function () {
				var id = Posts.insert({userId: Meteor.userId(), title: "Hello!"}, function () {
					Posts.remove(id);
				});
			});
		});

		server.once("removed", function (doc) {
			assert.equal(doc.title, "Hello!");
			done();
		});

	});


});
