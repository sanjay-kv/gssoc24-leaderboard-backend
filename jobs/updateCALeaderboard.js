const schedule = require('node-schedule');
const { generateLeaderboard } = require('../functions/generateCALeaderboard');



function updateCALeaderboardJob() {
    schedule.scheduleJob('0 0 */24 * * *', function () {
        console.log("========")
        console.log("Starting leaderboard updation job...");
        console.log("========")
        generateLeaderboard();
    });

}

module.exports.updateCALeaderboardJob = updateCALeaderboardJob;
