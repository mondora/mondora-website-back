Meteor.methods({
	openOfficeDoor: function () {
		if (!Roles.userIsInRole(Meteor.userId(), "consierge")) {
			throw new Meteor.Error("Unauthorized");
		}
		HTTP.get("http://tessel.mondora.com:11974/open?token=" + process.env.DOOR_OPENER_TOKEN);
	}
});
