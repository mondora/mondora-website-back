(function(){Meteor.publish("posts", function () {
	return Posts.find();
});

Meteor.publish("configurations", function () {
	return Configurations.find();
});

})();
