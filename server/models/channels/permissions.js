// Utils

// Role membership
var isInRoleChannels = function (userId) {
	return userId && Roles.userIsInRole(userId, "channels");
};

// Ownership
var isOwner = function (userId, channel) {
	return channel.userId === userId;
};
var isNotOwner = function (userId, channel) {
	return !isOwner(userId, channel);
};

// Curatorship
var isCurator = function (userId, channel) {
	var isCurator = false;
	_.forEach(channel.curators, function (curator) {
		if (curator.userId === userId) {
			isCurator = true;
		}
	});
	return isCurator;
};
var isNotCurator = function (userId, channel) {
	return !isCurator(userId, channel);
};



/*
 *	INSERT POLICIES
 *
 *	- allow users in role "channels" to insert channels (implies being logged in)
 *
 *	- deny insertion with spoofed userId
 *
 */

Channels.allow({
	insert: isInRoleChannels
});

Channels.deny({
	insert: isNotOwner
});



/*
 *	UPDATE POLICIES
 *
 *	- allow owners to update the channel
 *	- allow curators to update the channel
 *
 *	- deny owners to modify the owner
 *	- deny curators to modify the owner
 *	- deny curators to modify the curators
 *
 */

Channels.allow({
	update: isOwner
});
Channels.allow({
	update: isCurator
});

Channels.deny({
	update: function (userId, channel, fields) {
		if (isNotOwner(userId, channel)) return;
		return _.contains(fields, "userId");
	}
});
Channels.deny({
	update: function (userId, channel, fields) {
		if (isNotCurator(userId, channel)) return;
		if (isOwner(userId, channel)) return;
		return _.contains(fields, "userId");
	}
});
Channels.deny({
	update: function (userId, channel, fields) {
		if (isNotCurator(userId, channel)) return;
		if (isOwner(userId, channel)) return;
		return _.contains(fields, "curators");
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow owners to remove the channel
 *
 */

Channels.allow({
	remove: isOwner
});
