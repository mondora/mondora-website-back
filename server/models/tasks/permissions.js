// Utils

// Role membership
var isInRoleTasks = function (userId) {
	return userId && Roles.userIsInRole(userId, "tasks");
};

// Ownership
var isOwner = function (userId, task) {
	return task.userId === userId;
};
var isNotOwner = function (userId, task) {
	return !isOwner(userId, task);
};

// Participation
var isParticipant = function (userId, task) {
	var isParticipant = false;
	_.forEach(task.participants, function (participant) {
		if (participant.userId === userId) {
			isParticipant = true;
		}
	});
	return isParticipant;
};
var isNotParticipant = function (userId, task) {
	return !isParticipant(userId, task);
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
	insert: isInRoleTasks
});

Tasks.deny({
	insert: isNotOwner
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
	update: isOwner
});
Tasks.allow({
	update: isParticipant
});

Tasks.deny({
	update: function (userId, task, fields) {
		if (isNotOwner(userId, task)) return;
		return _.contains(fields, "userId");
	}
});
Tasks.deny({
	update: function (userId, task, fields) {
		if (isNotParticipant(userId, task)) return;
		if (isOwner(userId, task)) return;
		return _.contains(fields, "userId");
	}
});
Tasks.deny({
	update: function (userId, task, fields) {
		if (isNotParticipant(userId, task)) return;
		if (isOwner(userId, task)) return;
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
	remove: isOwner
});



/*
 *	TASK SELECTOR
 *
 */

CollectionSelector.TaskParticipants = function (userId) {
	var user = userId ? Meteor.users.findOne({_id: userId}) : {};
	return {
		// For the task to be selected either:
		$or: [
			{
				// The user must be the owner
				userId: user._id
			},
			{
				// The user must be one of the participants
				participants: {
					$elemMatch: {
						userId: user._id
					}
				}
			}
		]
	};
};
