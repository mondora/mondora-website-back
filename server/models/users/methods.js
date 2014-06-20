Meteor.methods({



	/////////////////////
	// Role management //
	/////////////////////

	addUserToRole: function (userId, role) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$addToSet: {roles: role}});
	},

	removeUserFromRole: function (userId, role) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$pull: {roles: role}});
	},



	//////////////////////
	// Group management //
	//////////////////////

	addUserToGroup: function (userId, group) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$addToSet: {groups: group}});
	},

	removeUserFromGroup: function (userId, group) {
		if (!Meteor.user().admin) {
			throw new Meteor.Error("Unauthorized");
		}
		Meteor.users.update({_id: userId}, {$pull: {groups: group}});
	}



});
