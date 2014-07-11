Meteor.publish("singleChannel", function (idOrName) {
	// Get the current user
	var user = Meteor.users.findOne({_id: this.userId}) || {};
	// Get the permissions selector
	var permissionsSelector = PermissionsEnum.Channels.getPermissionsSelectorForUser(user);
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
