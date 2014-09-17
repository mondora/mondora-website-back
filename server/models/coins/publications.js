Meteor.publish("myCoins", function () {
	return Coins.find({
		userId: this.userId
	});
});
