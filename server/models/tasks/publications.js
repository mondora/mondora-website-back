Meteor.publish("tasks", function () {
	var selector = PermissionsEnum.Tasks.getSelector(this.userId);
	return Tasks.find(selector);
});
