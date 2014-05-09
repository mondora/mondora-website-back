var canConfigure = function () {
	return Roles.userIsInRole(userId, "configure");
};

Configurations.allow({
	insert: canConfigure,
	update: canConfigure,
	remove: canConfigure
});
