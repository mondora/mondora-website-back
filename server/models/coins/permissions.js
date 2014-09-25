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



/*
 *	INSERT POLICIES
 *
 *	- insert not allowed, done via method to sanitize the day
 *
 */



/*
 *	UPDATE POLICIES
 *
 *	- allow owners to update the coin
 *
 *	- deny modifying the owner or the day
 *	- deny a regular user to modify the coin if frozen
 *
 */

Coins.allow({
	update: PermissionsEnum.Coins.isOwner
});

Coins.deny({
	update: function (userId, coin, fields) {
		return _.intersection(fields, ["userId", "day"]).length !== 0;
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
 *	- allow owners to remove the coin
 *
 *	- deny coin removal if frozen
 *
 */

Coins.allow({
	remove: PermissionsEnum.Coins.isOwner
});

Coins.deny({
	remove: function (userId, coin) {
		return coin.frozen;
	}
});
