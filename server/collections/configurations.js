var canConfigure = function () {
	return Roles.userIsInRole(userId, "configure");
};

Configurations = new Meteor.Collection("configurations");

Configurations.allow({
	insert: canConfigure,
	update: canConfigure,
	remove: canConfigure
});
