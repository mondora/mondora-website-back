Meteor.publish("allProjects", function () {
	if (!PermissionsEnum.Projects.isInRoleProjects(this.userId)) {
		return null;
	}
	return Projects.find({});
});
