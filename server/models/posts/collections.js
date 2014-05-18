Schema.Comment = new SimpleSchema({
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
	paragraph: {
		type: Number
	},
	anchor: {
		type: String,
		optional: true
	},
	text: {
		type: String
	},
	publishedOn: {
		type: Number
	},
	approved: {
		type: Boolean
	},
	approvedOn: {
		type: Number,
		optional: true
	}
});

Schema.Author = new SimpleSchema({
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

Schema.Post = new SimpleSchema({
	userId: {
		type: String
	},
	authors: {
		type: [Schema.Author],
		optional: true
	},
	titleImageUrl: {
		type: String,
		optional: true
	},
	map: {
		type: Object,
		optional: true,
		blackbox: true
	},
	title: {
		type: String,
		optional: true
	},
	subtitle: {
		type: String,
		optional: true
	},
	body: {
		type: String,
		optional: true
	},
	comments: {
		type: [Schema.Comment],
		optional: true
	},
	published: {
		type: Boolean,
		optional: true
	},
	publishedOn: {
		type: Number,
		optional: true
	}
});

Posts = new Meteor.Collection("posts", {
	schema: Schema.Post
});
