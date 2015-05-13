AdminConfig = {
    collections: {
        Channels: {
            icon: "slack",
            tableColumns: [
                {label: "Name", name: "name"},
                {label: "Common Name", name: "commonName"},
                {label: "User", name: "userId"}
            ],
            color: "red"
        },
        Coins: {
            icon: "bitcoin",
            tableColumns: [
                {label: "Day", name: "day"},
                {label: "User", name: "userId"}
            ],
            color: "green"
        },
        Configurations: {
            icon: "gears",
            tableColumns: [
                {label: "Name", name: "name"}
            ],
            color: "aqua"
        },
        Events: {
            icon: "calendar",
            tableColumns: [
                {label: "Day", name: "day"},
                {label: "Name", name: "name"},
                {label: "Country", name: "country"}
            ],
            color: "yellow"
        },
        Notifications: {
            icon: "bell",
            tableColumns: [
                {label: "Date", name: "date"},
                {label: "Channel", name: "channel"},
                {label: "Type", name: "type"}
            ],
            color: "olive"
        },
        Posts: {
            icon: "pencil",
            tableColumns: [
                {label: "Title", name: "title"},
                {label: "Published", name: "published"},
                {label: "User", name: "userId"}
            ],
            color: "purple"
        },
        Projects: {
            icon: "folder-open",
            tableColumns: [
                {label: "Name", name: "name"}
            ],
            color: "maroon"
        },
        Tasks: {
            icon: "tasks",
            tableColumns: [
                {label: "Date", name: "date"},
                {label: "Name", name: "name"},
                {label: "Status", name: "status"},
                {label: "User", name: "userId"}
            ],
            color: "teal"
        },
        UserLogs: {
            icon: "list-alt",
            tableColumns: [
                {label: "Date", name: "date"},
                {label: "User", name: "userId"}
            ],
            color: "orange"
        }
    }
};
