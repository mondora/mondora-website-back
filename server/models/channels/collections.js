Schema.Entry = new SimpleSchema({
	_id: {
		type: String
	},
	userId: {
		type: String
	},
	userScreenName: {
		type: String
	},
	userName: {
		type: String
	},
	userPictureUrl: {
		type: String
	},
	type: {
		type: String
	},
	content: {
		type: Object,
		optional: true,
		blackbox: true
	},
	publishedOn: {
		type: Number
	}
});

Schema.Channel = new SimpleSchema({
	userId: {
		type: String
	},
	curators: {
		type: [Schema.UserSummary],
		optional: true
	},
	mainImageUrl: {
		type: String,
		optional: true
	},
	name: {
		type: String,
		optional: true,
		index: true,
		unique: true
	},
	body: {
		type: String,
		optional: true
	},
	published: {
		type: Boolean,
		optional: true
	},
	permissions: {
		type: Schema.SharePermissions,
		optional: true
	},
	entries: {
		type: [Schema.Entry],
		optional: true
	}
});

Channels = new Meteor.Collection("channels", {
	schema: Schema.Channel
});
