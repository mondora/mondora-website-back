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

Schema.Curator = new SimpleSchema({
	userId: {
		type: String
	},
	screenName: {
		type: String,
		optional: true
	},
	name: {
		type: String,
		optional: true
	},
	pictureUrl: {
		type: String,
		optional: true
	}
});

Schema.Channel = new SimpleSchema({
	userId: {
		type: String
	},
	curators: {
		type: [Schema.Curator],
		optional: true
	},
	mainImageUrl: {
		type: String,
		optional: true
	},
	title: {
		type: String,
		optional: true,
		index: true,
		unique: true
	},
	subtitle: {
		type: String,
		optional: true
	},
	body: {
		type: String,
		optional: true
	},
	groups: {
		type: [String],
		optional: true
	},
	members: {
		type: [String],
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
