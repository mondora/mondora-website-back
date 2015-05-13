Schema = {};

Schema.UserSummary = new SimpleSchema({
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

Schema.SharePermissions = new SimpleSchema({
	groups: {
		type: [String],
		optional: true
	},
	members: {
		type: [String],
		optional: true
	},
	public: {
		type: Boolean,
		optional: true
	}
});
