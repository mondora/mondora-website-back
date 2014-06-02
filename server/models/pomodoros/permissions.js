// Ownership
var isOwner = function (userId, pomodoro) {
	return pomodoro.userId === userId;
};

// Starts paused
var isNotPaused = function (userId, pomodoro) {
	return pomodoro.status !== "paused";
};

Pomodoros.allow({
	insert: isOwner
});

Pomodoros.deny({
	insert: isNotPaused
})
