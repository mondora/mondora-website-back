///////////////////////////////////////
// PermissionsEnum methods for tasks //
///////////////////////////////////////

PermissionsEnum.Tasks = {};

// Role membership
PermissionsEnum.Tasks.isInRoleTasks = function (userId) {
	return userId && Roles.userIsInRole(userId, "tasks");
};
// Ownership
PermissionsEnum.Tasks.isOwner = function (userId, task) {
	return task.userId === userId;
};
PermissionsEnum.Tasks.isNotOwner = function (userId, task) {
	return !PermissionsEnum.Tasks.isOwner(userId, task);
};
// Participation
PermissionsEnum.Tasks.isParticipant = function (userId, task) {
	var isParticipant = false;
	_.forEach(task.participants, function (participant) {
		if (participant.userId === userId) {
			isParticipant = true;
		}
	});
	return isParticipant;
};
PermissionsEnum.Tasks.isNotParticipant = function (userId, task) {
	return !PermissionsEnum.Tasks.isParticipant(userId, task);
};
// Access permissions
PermissionsEnum.Tasks.userHasAccess = function (user, task) {
	// The user can access the task when either:
	return (
		// the user is the owner
		PermissionsEnum.Tasks.isOwner(user._id, task) ||
		// the user is a participant
		PermissionsEnum.Tasks.isParticipant(user._id, task)
	);
};
// Selector for publish functions
PermissionsEnum.Tasks.getSelector = function (userId) {
	return {
		// For the task to be selected either:
		$or: [
			{
				// The user must be the owner
				userId: userId
			},
			{
				// The user must be one of the participants
				participants: {
					$elemMatch: {
						userId: userId
					}
				}
			}
		]
	};
};





/*
 *	INSERT POLICIES
 *
 *	- allow users in role "tasks" to insert tasks (implies being logged in)
 *
 *	- deny insertion with spoofed userId
 *
 */



Tasks.allow({
	insert: PermissionsEnum.Tasks.isInRoleTasks
});

Tasks.deny({
	insert: PermissionsEnum.Tasks.isNotOwner
});



/*
 *	UPDATE POLICIES
 *
 *	- allow owners to update the tasks
 *	- allow participants to update the tasks
 *
 *	- deny owners to modify the owner
 *	- deny participants to modify the owner
 *	- deny participants to modify the participants
 *
 */


Tasks.allow({
	update: PermissionsEnum.Tasks.isOwner
});
Tasks.allow({
	update: PermissionsEnum.Tasks.isParticipant
});

Tasks.deny({
	update: function (userId, task, fields) {
		if (PermissionsEnum.Tasks.isNotOwner(userId, task)) return;
		return _.contains(fields, "userId");
	}
});
Tasks.deny({
	update: function (userId, task, fields) {
		if (PermissionsEnum.Tasks.isNotParticipant(userId, task)) return;
		if (PermissionsEnum.Tasks.isOwner(userId, task)) return;
		return _.contains(fields, "userId");
	}
});
Tasks.deny({
	update: function (userId, task, fields) {
		if (PermissionsEnum.Tasks.isNotParticipant(userId, task)) return;
		if (PermissionsEnum.Tasks.isOwner(userId, task)) return;
		return _.contains(fields, "participants");
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow owners to remove tasks
 *
 */



Tasks.allow({
	remove: PermissionsEnum.Tasks.isOwner
});
