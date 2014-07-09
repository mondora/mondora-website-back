Posts.after.update(function (userId, doc) {
	if (
		doc.published &&
		doc.published !== this.previous.published &&
		doc.notifyOnPublication
	) {
		// Notify everyone
	}
});
