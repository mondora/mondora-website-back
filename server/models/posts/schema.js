Schema.Comment = new SimpleSchema({
	_id: {
		type: String
	},
	userId: {
		type: String
	},
	paragraph: {
		type: Number
	},
	anchor: {
		type: String,
		optional: true
	},
	content: {
		type: String
	},
	publishedOn: {
		type: Number
	},
	approved: {
		type: String,
		optional: true
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
	imageUrl: {
		type: String,
		optional: true
	}
});

Schema.Post = new SimpleSchema({
	userId: {
		type: String,
		denyUpdate: true
	},
	authors: {
		type: [Schema.Author],
		optional: true
	},
	titleImageUrl: {
		type: String,
		optional: true
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
