Meteor.startup(function() {
    var configuration = Configurations.findOne({});
    if (!configuration) {
        Configurations.insert({
            "banner": {
                "title": "<a href=\"https://www.bcorporation.net/community/mondora-srl\"> <img width=\"90px\" src=\"https://s3.amazonaws.com/mnd-website/img/logo-bcorp-red.png\" /></a>",
                "date": "",
                "text": "first IT b-corp in EU!"
            },
            "name": "home",
            "payoff": {
                "firstLine": "",
                "secondLine": ""
            },
            "public": true,
            "sprinkleText": "mondora is a software and advisory company specialising in technology governance and providing innovative software solutions, development, design and technical training to a range of large organizations, across multiple industries. mondora supports clients with the design, implementation and operation of a variety of IT environments and the associated teams and governance structures, with a strong focus on the implementation and management of emerging technological paradigms, such as cloud computing, Agile Methodologies and DevOps. Over the years mondora has developed significant experience assessing and evolving complex architectures, and driving IT and business alignment. Among other projects, mondora has brought to market the product ControlMyCloud, a platform for managing SLAs on the cloud, that has been the baseline for industry standard and commercial research.",
            "videoUrls": [{
                "mp4": "https://s3.amazonaws.com/mnd-website/videos/mnd-11.mp4",
                "webm": "https://s3.amazonaws.com/mnd-website/videos/mnd-11.webm",
                "poster": "https://s3.amazonaws.com/mnd-website/videos/mnd-11-poster.jpg"
            }],
            "header": "Mondora The Best Corp of All Time",
            "footer": "Footer text here",
            "center": "<img src=\"https://s3.amazonaws.com/mnd-website/img/mondora-logo.png\" />",
            "activeProjects": 5,
            "activeClients": 6,
            "weeksCommits": 300,
            "todaysDeploys": 10,
            "openSourceProjects": 25,
            "co2Reduction": 27,
            "volunteeringWorkDays": 4
        });
        Configurations.insert({
            "items" : [
                {
                    "title" : "Home",
                    "type" : "link",
                    "link" : "/#!/",
                    "items" : [],
                    "roles" : ""
                },
                {
                    "title" : "Latest posts",
                    "type" : "link",
                    "link" : "#!/post/list"
                },
                {
                    "title" : "Edit profile",
                    "type" : "link",
                    "loginRequired" : true,
                    "link" : "/#!/profile"
                },
                {
                    "title" : "Admin",
                    "type" : "link",
                    "roles" : "admin",
                    "link" : "/#!/admin"
                },
                {
                    "title" : "User admin",
                    "type" : "link",
                    "loginRequired" : true,
                    "roles" : "admin",
                    "link" : "/#!/users"
                }
            ],
            "name" : "menu",
            "public" : true
        });
    }
});
