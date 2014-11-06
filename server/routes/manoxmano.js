Router.map(function () {

	this.route("manoxmano", {
		where: "server",
		action: function () {
			ManoXManoUsers.insert(this.request.body);
			this.response.writeHead(200);
			this.response.end();
		}
	});

});

