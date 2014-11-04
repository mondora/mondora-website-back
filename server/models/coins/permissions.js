///////////////////////////////////////
// PermissionsEnum methods for coins //
///////////////////////////////////////

PermissionsEnum.Coins = {};

// Role membership
PermissionsEnum.Coins.isInRoleCoins = function (userId) {
	return userId && Roles.userIsInRole(userId, "coins");
};
PermissionsEnum.Coins.isInRoleCoinManager = function (userId) {
	return userId && Roles.userIsInRole(userId, "coin-manager");
};
// Ownership
PermissionsEnum.Coins.isOwner = function (userId, coin) {
	return coin.userId === userId;
};
PermissionsEnum.Coins.isNotOwner = function (userId, coin) {
	return !PermissionsEnum.Coins.isOwner(userId, coin);
};
// Activity validation
PermissionsEnum.Coins.activitiesAreValid = function (activities) {
	try {
		var projectIds = {};
		var totalTimeSpent = 0;
		_.forEach(activities, function (activity) {

			// Ensure there can't be multiple activities referring to the same project
			if (projectIds[activity.projectId]) {
				throw new Meteor.Error("Duplicate activities");
			}
			projectIds[activity.projectId] = true;
			
			// Ensure timeSpent is a positive integer
			if (activity.timeSpent < 0) {
				throw new Meteor.Error("Can't have negative time spent");
			}
			totalTimeSpent += activity.timeSpent;

			// Ensure the total time spent is less than 24
			if (totalTimeSpent > 24) {
				throw new Meteor.Error("Can't work more than 24h/d");
			}

			// Ensure the project exists
			// (more performant than `findOne` as it doesn't fetch the project)
			var count = Projects.find({_id: activity.projectId}).count();
			if (count !== 1) {
				throw new Meteor.Error("Project not found");
			}

		});
	} catch (e) {
		return false;
	}
	return true;
};
// Day validation
PermissionsEnum.Coins.dayIsValid = function (day) {
	return moment(day).utc().startOf("day").valueOf() === day;
};
// Ensure uniqueness of coin by user and day
PermissionsEnum.Coins.coinAlreadyExists = function (userId, coin) {
	var exists = Coins.findOne({
		userId: userId,
		day: coin.day
	});
	return !!exists;
};



/*
 *	INSERT POLICIES
 *
 *	- allow users in the "coins" role to insert coins
 *	- allow users in the "coin-manager" role to insert coins
 *
 *	- deny users to spoof a coin "userId", unless they're coin-managers
 *	- deny inserting coins with invalid activities
 *	- deny inserting coins with an invalid day
 *	- deny inserting a coin for a user if a coin with the same day already exists for that user
 *
 */

Coins.allow({
	insert: PermissionsEnum.Coins.isInRoleCoins
});

Coins.allow({
	insert: PermissionsEnum.Coins.isInRoleCoinManager
});

Coins.deny({
	insert: function (userId, coin) {
		return !(
			PermissionsEnum.Coins.isInRoleCoinManager(userId) ||
			PermissionsEnum.Coins.isOwner(userId, coin)
		);
	}
});

Coins.deny({
	insert: function (userId, coin) {
		return !PermissionsEnum.Coins.activitiesAreValid(coin.activities);
	}
});

Coins.deny({
	insert: function (userId, coin) {
		return !PermissionsEnum.Coins.dayIsValid(coin.day);
	}
});

Coins.deny({
	insert: PermissionsEnum.Coins.coinAlreadyExists
});



/*
 *	UPDATE POLICIES
 *
 *	- allow owners to update the coin
 *	- allow coin-managers to update the coin
 *
 *	- deny modifying the owner or the day
 *	- deny setting invalid activities
 *	- deny a regular user to modify the coin if frozen
 *
 */

Coins.allow({
	update: PermissionsEnum.Coins.isOwner
});

Coins.allow({
	update: PermissionsEnum.Coins.isInRoleCoinManager
});

Coins.deny({
	update: function (userId, coin, fields) {
		return _.intersection(fields, ["userId", "day"]).length !== 0;
	}
});

Coins.deny({
	update: function (userId, coin) {
		return !PermissionsEnum.Coins.activitiesAreValid(coin.activities);
	}
});

Coins.deny({
	update: function (userId, coin) {
		return !PermissionsEnum.Coins.isInRoleCoinManager(userId) && coin.frozen;
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow users to remove their coins
 *	- allow coin-managers to remove coins
 *
 *	- deny removing the coin if it's frozen
 *
 */

Coins.allow({
	remove: PermissionsEnum.Coins.isOwner
});

Coins.allow({
	remove: PermissionsEnum.Coins.isInRoleCoinManager
});

Coins.deny({
	remove: function (userId, coin) {
		return coin.frozen;
	}
});
