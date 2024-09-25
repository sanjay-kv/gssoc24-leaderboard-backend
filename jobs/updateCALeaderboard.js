const schedule = require('node-schedule');
const { generateCALeaderboard } = require('../functions/generateCALeaderboard');



function updateCALeaderboardJob() {
    schedule.scheduleJob('0 0 * * * *', function () {
        console.log("========")
        console.log("Starting leaderboard updation job...");
        console.log("========")
        generateCALeaderboard();
    });

}

module.exports.updateCALeaderboardJob = updateCALeaderboardJob;
