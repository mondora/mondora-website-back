/*
var assert = require("assert");

suite("Posts Permissions", function() {

	////////////////////////
	// Insert permissions //
	////////////////////////

	test("insert allowed for users in role \"blog\"", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Meteor.users.update({}, {$set: {roles: ["blog"]}});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.insert({userId: Meteor.userId()}, function (err) {
					emit("insertResult", err);
				});
			});
		});
		client.on("insertResult", function (err) {
			assert.equal(err, null);
			done();
		});
	});

	test("insert denied for not logged in users", function (done, server, client) {
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Posts.insert({userId: "justAStubToBypassValidation"}, function (err) {
				emit("insertResult", err);
			});
		});
		client.on("insertResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	test("insert denied for users not in role \"blog\"", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.insert({userId: Meteor.userId()}, function (err) {
					emit("insertResult", err);
				});
			});
		});
		client.on("insertResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	test("userId spoofing on insert denied", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Meteor.users.update({}, {$set: {roles: ["blog"]}});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.insert({userId: "notThisUsersId"}, function (err) {
					emit("insertResult", err);
				});
			});
		});
		client.on("insertResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	////////////////////////
	// Update permissions //
	////////////////////////

	test("updating allowed for owners", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "postId",
				userId: userId
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.update({_id: "postId"}, {$set: {published: true}}, function (err) {
					emit("updateResult", err);
				});
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err, null);
			done();
		});
	});

	test("updating allowed for authors", function (done, server, client) {
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
				Posts.update({_id: "postId"}, {$set: {published: true}}, function (err) {
					emit("updateResult", err);
				});
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err, null);
			done();
		});
	});

	test("update disallowed for non-logged-in users", function (done, server, client) {
		server.eval(function () {
			Posts.insert({
				_id: "postId",
				userId: "someUserId"
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Posts.update({_id: "postId"}, {$set: {published: false}}, function (err) {
				emit("updateResult", err);
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	test("update disallowed for non-owners and non-authors", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Posts.insert({
				_id: "postId",
				userId: "someUserId",
				authors: [{
					userId: "someOtherUserId"
				}]
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.update({_id: "postId"}, {$set: {published: true}}, function (err) {
					emit("updateResult", err);
				});
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	test("updating userId disallowed for owners", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "postId",
				userId: userId
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.update({_id: "postId"}, {$set: {userId: "anotherUserId"}}, function (err) {
					emit("updateResult", err);
				});
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	test("updating userId disallowed for authors", function (done, server, client) {
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
				Posts.update({_id: "postId"}, {$set: {userId: "anotherUserId"}}, function (err) {
					emit("updateResult", err);
				});
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	test("updating authors disallowed for authors", function (done, server, client) {
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
				Posts.update({_id: "postId"}, {$set: {authors: [{userId: "anotherUserId"}]}}, function (err) {
					emit("updateResult", err);
				});
			});
		});
		client.on("updateResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

	////////////////////////
	// Remove permissions //
	////////////////////////

	test("removing allowed for owners", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			var userId = Meteor.users.findOne()._id;
			Posts.insert({
				_id: "postId",
				userId: userId
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.remove("postId", function (err) {
					emit("removeResult", err);
				});
			});
		});
		client.on("removeResult", function (err) {
			assert.equal(err, null);
			done();
		});
	});

	test("remove disallowed for non-owners", function (done, server, client) {
		server.eval(function () {
			Accounts.createUser({email: "a@a.com", password: "123456"});
			Posts.insert({
				_id: "postId",
				userId: "someUserId"
			});
		});
		client.eval(function () {
			Posts = new Meteor.Collection("posts");
			Meteor.loginWithPassword("a@a.com", "123456", function() {
				Posts.remove("postId", function (err) {
					emit("removeResult", err);
				});
			});
		});
		client.on("removeResult", function (err) {
			assert.equal(err.error, 403);
			done();
		});
	});

});
*/
