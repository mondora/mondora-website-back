PermissionsEnum.Users = {};

PermissionsEnum.Users.isAdmin = function (userId) {
	return Roles.userIsInRole(userId, "admin");
};
