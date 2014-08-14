var ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

var getDelay = function () {
	var sum = function (array) {
		return array.reduce(function (acc, num) {
			return acc + num;
		}, 0);
	};

	var SENDING_DAY = 2;
	var SENDING_HOUR = 4;
	var SENDING_MINUTE = 0;
	var SENDING_SECOND = 0;
	var SENDING_MILLISECOND = 0;


	var zeroThenDelta = sum([
		SENDING_DAY * 24 * 60 * 60 * 1000,
		SENDING_HOUR * 60 * 60 * 1000,
		SENDING_MINUTE * 60 * 1000,
		SENDING_SECOND * 1000,
		SENDING_MILLISECOND
	]);

	var now = new Date();
	var zeroNowDelta = sum([
		now.getUTCDay() * 24 * 60 * 60 * 1000,
		now.getUTCHours() * 60 * 60 * 1000,
		now.getUTCMinutes() * 60 * 1000,
		now.getUTCSeconds() * 1000,
		now.getUTCMilliseconds()
	]);

	var nowThenDelta;
	if (zeroNowDelta < zeroThenDelta) {
		nowThenDelta = zeroThenDelta - zeroNowDelta;
	} else {
		nowThenDelta = (zeroThenDelta - zeroNowDelta) + ONE_WEEK_IN_MS;
	}
	return nowThenDelta;
};

Cron.sendWeeklyDigest = function () {
	console.log("SENDING WEEKLY DIGEST...");
	var selector = {
		published: true,
		publishedOn: {
			$gt: Date.now() - ONE_WEEK_IN_MS
		}
	};
	var options = {
		sort: {
			publishedOn: -1
		}
	};
	var previousWeekPosts = Posts.find(selector, options).fetch();

	var getUserEmail = function (user) {
		return _.reduce(user.emails, function (acc, email) {
			if (acc) {
				return acc;
			}
			return email.verified ? email.address : false;
		}, false);
	};

	Meteor.users.find({}).forEach(function (user) {
		var email = getUserEmail(user);
		if (!email) {
			return;
		}
		var byAccess = _.partial(PermissionsEnum.Posts.userHasAccess, user);
		var posts = previousWeekPosts.filter(byAccess);
		var text = "Hey " + user.profile.name + ",\n\n";
		text += "Here's what we've been writing at mondora this week:\n\n";
		text += posts.reduce(function (acc, post, index) {
			acc += (index + 1) + ".  " + post.title + "\n";
			acc += "     " + post.subtitle + "\n";
			acc += "     by " + post.authors[0].name + "\n";
			acc += "     https://mondora.com/#!/post/" + post._id + "\n\n";
			return acc;
		}, "");
		text += "Have a good day\n";
		text += "mondobot";
		Email.send({
			from: "mondora weekly <mondora-weekly@mondora.com>",
			to: email,
			subject: "mondora weekly",
			text: text
		});
	});
};

Meteor.setTimeout(function () {
	Cron.sendWeeklyDigest();
	Meteor.setInterval(Cron.sendWeeklyDigest, ONE_WEEK_IN_MS);
}, getDelay());
