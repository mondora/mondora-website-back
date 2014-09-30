Schema.Events = new SimpleSchema({
	day: {
		type: Number
	},
	country: {
		type: String
	},
	name: {
		type: String
	}
});

Events = new Meteor.Collection("events", {
	schema: Schema.Events
});
