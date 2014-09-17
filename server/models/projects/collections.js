Schema.Projects = new SimpleSchema({
	name: {
		type: String
	}
});

Projects = new Meteor.Collection("projects", {
	schema: Schema.Projects
});
