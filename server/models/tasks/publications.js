Meteor.publish("tasks", function () {
	var selector = CollectionSelector.TaskParticipants(this.userId);
	return Tasks.find(selector);
});
