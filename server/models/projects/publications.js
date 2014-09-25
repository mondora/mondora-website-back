Meteor.publish("allProjects", function () {
	if (!PermissionsEnum.Coins.isInRoleCoins(this.userId)) {
		return null;
	}
	return Projects.find({});
});
