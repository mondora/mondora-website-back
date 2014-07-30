PermissionsEnum.Configurations = {};

PermissionsEnum.Configurations.isAdmin = function (userId) {
	return Roles.userIsInRole(userId, "admin");
};

Configurations.allow({
	insert: PermissionsEnum.Configurations.isAdmin,
	update: PermissionsEnum.Configurations.isAdmin,
	remove: PermissionsEnum.Configurations.isAdmin
});

