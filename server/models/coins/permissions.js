///////////////////////////////////////
// PermissionsEnum methods for coins //
///////////////////////////////////////

PermissionsEnum.Coins = {};

// Role membership
PermissionsEnum.Coins.isInRoleCoins = function (userId) {
	return userId && Roles.userIsInRole(userId, "coins");
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
 *	- allow users in role "coins" to insert coins (implies being logged in)
 *
 *	- deny insertion with spoofed userId
 *
 */

Coins.allow({
	insert: PermissionsEnum.Coins.isInRoleCoins
});

Coins.deny({
	insert: PermissionsEnum.Coins.isNotOwner
});



/*
 *	UPDATE POLICIES
 *
 *	- allow owners to update the coin
 *
 *	- deny modifying the owner
 *	- deny modifying the coin if frozen
 *
 */

Coins.allow({
	update: PermissionsEnum.Coins.isOwner
});

Coins.deny({
	update: function (userId, coin, fields) {
		return _.contains(fields, "userId");
	}
});
Coins.deny({
	update: function (userId, coin) {
		return coin.frozen;
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
