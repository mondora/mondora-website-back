//////////////////////////////////////////
// PermissionsEnum methods for projects //
//////////////////////////////////////////

PermissionsEnum.Projects = {};

// Role membership
PermissionsEnum.Projects.isInRoleProjects = function (userId) {
	return userId && Roles.userIsInRole(userId, "projects");
};



/*
 *	INSERT POLICIES
 *
 *	- allow users in role "project" to insert projects (implies being logged in)
 *
 */

Projects.allow({
	insert: PermissionsEnum.Projects.isInRoleProjects
});



/*
 *	UPDATE POLICIES
 *
 *	- allow users in role "project" to update projects (implies being logged in)
 *
 */

Projects.allow({
	update: PermissionsEnum.Projects.isInRoleProjects
});



/*
 *	REMOVE POLICIES
 *
 *	- allow users in role "project" to remove projects (implies being logged in)
 *
 */

Projects.allow({
	remove: PermissionsEnum.Projects.isInRoleProjects
});
