var assert = require("assert");

suite("Posts Publications", function () {

	test("the server exposes a \"latestPosts\" publication", function (done, server, client) {
		server.eval(function () {
			Posts.insert({
				userId: Random.id(),
				published: true,
				publishedOn: new Date("07-18-2014").getTime(),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				userId: Random.id(),
				published: true,
				publishedOn: new Date("07-18-2013").getTime(),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				userId: Random.id(),
				published: false,
				publishedOn: new Date("07-18-2012").getTime(),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				userId: Random.id(),
				published: true,
				publishedOn: new Date("07-18-2011").getTime(),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				userId: Random.id(),
				published: true,
				publishedOn: new Date("07-18-2010").getTime(),
				permissions: {
					public: true
				}
			});
			Posts.insert({
				userId: Random.id(),
				published: false,
				publishedOn: new Date("07-18-2009").getTime(),
				permissions: {
					public: true
				}
			});
			emit("postsInserted");
		});
		server.on("postsInserted", function () {
			client.eval(function () {
				Posts = new Meteor.Collection("posts");
				Meteor.subscribe("latestPosts", 3, function () {
					var posts = Posts.find().fetch();
					var actual = _.pluck(posts, "publishedOn").sort();
					emit("result", actual);
				});
			});	
		});
		client.on("result", function (actual) {
			var expected = [
				new Date("07-18-2011").getTime(),
				new Date("07-18-2013").getTime(),
				new Date("07-18-2014").getTime()
			];
			var isEqual = actual.reduce(function (acc, date, index) {
				if (!acc) return acc;
				return date === expected[index];
			}, true);
			assert.equal(isEqual, true);
			done();
		});

	});

});
