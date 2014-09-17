Meteor.publish("allProjects", function () {
	if (!PermissionsEnum.Projects.isInRoleProject(this.userId)) {
		return null;
	}
	return Projects.find({});
});
