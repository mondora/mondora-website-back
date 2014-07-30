Meteor.publish("configurations", function () {
	return Configurations.find({public: true});
});

Meteor.publish("serverConfigurations", function () {
	if (!PermissionsEnum.Configurations.isAdmin(this.userId)) {
		return null;
	}
	return Configurations.find({});
});
