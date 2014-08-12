Meteor.methods({
	openOfficeDoor: function () {
		if (!Roles.userIsInRole(Meteor.userId(), "consierge")) {
			throw new Meteor.Error("Unauthorized");
		}
		HTTP.get("http://door.mondora.com/open?token=" + process.env.DOOR_OPENER_TOKEN);
	}
});
