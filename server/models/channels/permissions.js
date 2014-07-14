//////////////////////////////////////////
// PermissionsEnum methods for channels //
//////////////////////////////////////////

PermissionsEnum.Channels = {};

// Role membership
PermissionsEnum.Channels.isInRoleChannels = function (userId) {
	return userId && Roles.userIsInRole(userId, "channels");
};
// Ownership
PermissionsEnum.Channels.isOwner = function (userId, channel) {
	return channel.userId === userId;
};
PermissionsEnum.Channels.isNotOwner = function (userId, channel) {
	return !PermissionsEnum.Channels.isOwner(userId, channel);
};
// Curatorship
PermissionsEnum.Channels.isCurator = function (userId, channel) {
	var isCurator = false;
	_.forEach(channel.curators, function (curator) {
		if (curator.userId === userId) {
			isCurator = true;
		}
	});
	return isCurator;
};
PermissionsEnum.Channels.isNotCurator = function (userId, channel) {
	return !PermissionsEnum.Channels.isCurator(userId, channel);
};
// Access permissions
PermissionsEnum.Channels.userHasAccess = function (user, channel) {
	// The user can access the channel when either:
	return (
		// the user is the owner
		PermissionsEnum.Channels.isOwner(user._id, channel) ||
		// the user is a curator
		PermissionsEnum.Channels.isAuthor(user._id, channel) ||
		(
			// the channel is published and either:
			channel.published === true &&
			(
				// the channel is public
				channel.permissions.public ||
				// the user belongs to a group the channel has been shared to
				_.intersection(user.groups, channel.permissions.groups).length > 0 ||
				// the channel has been shared to the user
				_.contains(channel.permissions.members, user._id)
			)
		)
	);
};
// Selector for publish functions
PermissionsEnum.Channels.getPermissionsSelector = function (user) {
	return {
		// For the channel to be selected either:
		$or: [
			{
				// The user must be the owner
				userId: user._id
			},
			{
				// The user must be one of the curators
				curators: {
					$elemMatch: {
						userId: user._id
					}
				}
			},
			{
				// The channel must be published and either
				$and: [
					{
						published: true
					},
					{
						$or: [
							{
								// The user is in one of the allowed groups
								"permissions.groups": {
									// The user may not have a groups property
									$in: user.groups || []
								}
							},
							{
								// The user is a member of the channel
								"permissions.members": {
									$in: [user._id]
								}
							},
							{
								// The channel is public
								"permissions.public": true
							}
						]
					}
				]
			}
		]
	};
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
	insert: PermissionsEnum.Channels.isInRoleChannels
});

Channels.deny({
	insert: PermissionsEnum.Channels.isNotOwner
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
 *	- deny everybody to modify notifications
 *
 */

Channels.allow({
	update: PermissionsEnum.Channels.isOwner
});
Channels.allow({
	update: PermissionsEnum.Channels.isCurator
});

Channels.deny({
	update: function (userId, channel, fields) {
		if (PermissionsEnum.Channels.isNotOwner(userId, channel)) return;
		return _.contains(fields, "userId");
	}
});
Channels.deny({
	update: function (userId, channel, fields) {
		if (PermissionsEnum.Channels.isNotCurator(userId, channel)) return;
		if (PermissionsEnum.Channels.isOwner(userId, channel)) return;
		return _.contains(fields, "userId");
	}
});
Channels.deny({
	update: function (userId, channel, fields) {
		if (PermissionsEnum.Channels.isNotCurator(userId, channel)) return;
		if (PermissionsEnum.Channels.isOwner(userId, channel)) return;
		return _.contains(fields, "curators");
	}
});
Channels.deny({
	update: function (userId, channel, fields) {
		return _.contains(fields, "notifications");
	}
});



/*
 *	REMOVE POLICIES
 *
 *	- allow owners to remove the channel
 *
 */

Channels.allow({
	remove: PermissionsEnum.Channels.isOwner
});
