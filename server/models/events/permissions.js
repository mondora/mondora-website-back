////////////////////////////////////////
// PermissionsEnum methods for events //
////////////////////////////////////////

PermissionsEnum.Events = {};

// Role membership
PermissionsEnum.Events.isInRoleEvents = function (userId) {
	return userId && Roles.userIsInRole(userId, "events");
};



/*
 *	INSERT POLICIES
 *
 *	- insert not allowed, done via method to sanitize the day
 *
 */


/*
 *	UPDATE POLICIES
 *
 *	- allow if user belongs to the "events" role
 *
 *	- deny modifying the day
 *
 */

Events.allow({
	update: PermissionsEnum.Events.isInRoleEvents
});

Events.deny({
	update: function (userId, event, fields) {
		return _.contains(fields, "day");
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow if user belongs to the "events" role
 *
 */

Events.allow({
	remove: PermissionsEnum.Events.isInRoleEvents
});
