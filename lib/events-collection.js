Schema.Events = new SimpleSchema({
	day: {
		type: Number
	},
	country: {
		type: String
	},
	name: {
		type: String
	},
	denyWorking: {
		type: Boolean
	},
	tags: {
		type: [String],
		optional: true
	}
});

Events = new Mongo.Collection("events");
Events.attachSchema(Schema.Events);
