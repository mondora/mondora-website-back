//////////////////////////////////////////
// PermissionsEnum methods for projects //
//////////////////////////////////////////

PermissionsEnum.Projects = {};

// Role membership
PermissionsEnum.Projects.isInRoleProject = function (userId) {
	return userId && Roles.userIsInRole(userId, "project");
};



/*
 *	INSERT POLICIES
 *
 *	- allow users in role "project" to insert projects (implies being logged in)
 *
 */

Projects.allow({
	insert: PermissionsEnum.Projects.isInRoleProject
});



/*
 *	UPDATE POLICIES
 *
 *	- allow users in role "project" to update projects (implies being logged in)
 *
 */

Projects.allow({
	update: PermissionsEnum.Projects.isInRoleProject
});



/*
 *	REMOVE POLICIES
 *
 *	- allow users in role "project" to remove projects (implies being logged in)
 *
 */

Projects.allow({
	remove: PermissionsEnum.Projects.isInRoleProject
});
