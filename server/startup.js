var connectHandler = WebApp.connectHandlers;

Meteor.startup(function () {
	connectHandler.use(function (req, res, next) {
		res.setHeader("Access-Control-Allow-Origin", "*");
		return next();
	});
});
