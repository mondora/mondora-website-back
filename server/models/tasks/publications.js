Meteor.publish("tasks", function () {
	var selector = PermissionsEnum.Tasks.getSelector(this.userId);
	return Tasks.find(selector);
});

Meteor.publish("bookmarks", function () {
	var selector = {
		$and: [
			{
				tags: {
					$in: ["bookmark"]
				}
			},
			PermissionsEnum.Tasks.getSelector(this.userId)
		]
	};
	return Tasks.find(selector);
});
