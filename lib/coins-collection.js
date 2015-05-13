Schema.Activity = new SimpleSchema({
	projectId: {
		type: String
	},
	timeSpent: {
		type: Number
	}
});

Schema.Coin = new SimpleSchema({
	userId: {
		type: String
	},
	day: {
		type: Number
	},
	activities: {
		type: [Schema.Activity]
	},
	frozen: {
		type: Boolean,
		optional: true
	}
});

Coins = new Mongo.Collection("coins");
Coins.attachSchema(Schema.Coin);
