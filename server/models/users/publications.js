Meteor.publish("userAdditionalInfo", function () {
	var selector = {
		_id: this.userId
	};
	var options = {
		fields: {
			mondoraTeamMember: 1
		}
	};
	return Meteor.users.find(selector, options);
});

Meteor.publish("singleUser", function (userId) {
	var selector = {
		_id: userId
	};
	var options = {
		fields: {
			profile: 1
		}
	};
	return Meteor.users.find(selector, options);
});

Meteor.publish("teamUsers", function () {
	var selector = {
		mondoraTeamMember: true
	};
	var options = {
		fields: {
			mondoraTeamMember: 1,
			profile: 1
		}
	};
	return Meteor.users.find(selector, options);
});

Meteor.publish("allUsers", function () {
	var selector = {
	};
	var options = {
		fields: {
			profile: 1
		}
	};
	return Meteor.users.find(selector, options);
});
