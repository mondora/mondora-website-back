Schema.Project = new SimpleSchema({
	name: {
		type: String
	}
});

Projects = new Mongo.Collection("projects");
Projects.attachSchema(Schema.Project);
