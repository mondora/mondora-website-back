Meteor.publish("singleChannel", function (idOrName) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Channels.getPermissionsSelector(user);
	// Construct the selector
	var selector = {
		$and: [
			{
				$or: [
					{
						_id: idOrName
					},
					{
						name: idOrName
					}
				]
			},
			permissionsSelector
		]
	};
	// Return the cursor finding that post
	return Channels.find(selector);
});

Meteor.publish("channelsByFuzzyName", function (name, limit, getUnpublished) {
	// Sanitize the name
	name = name || "";
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Channels.getPermissionsSelector(user);
	// Construct the selector
	var selector = {
		$and: [
			{
				name: new RegExp(name, "i")
			},
			permissionsSelector
		]
	};
	if (!getUnpublished) {
		selector.$and.published = true;
	}
	// Sanitize the limit
	limit = parseInt(limit, 10);
	limit = isNaN(limit) ? 10 : limit;
	var options = {
		limit: limit,
		fields: {
			name: 1,
			commonName: 1,
			curators: 1,
			published: 1,
			permissions: 1
		}
	};
	// Return the cursor finding that post
	return Channels.find(selector, options);
});
