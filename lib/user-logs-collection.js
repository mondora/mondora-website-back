Schema.UserLog = new SimpleSchema({
	userId: {
		type: String
	},
	date: {
		type: Number
	},
	details: {
		type: Object,
		blackbox: true
	}
});

UserLogs = new Mongo.Collection("userLogs");
UserLogs.attachSchema(Schema.UserLog);
