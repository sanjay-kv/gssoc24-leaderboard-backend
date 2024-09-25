//starter express file
const express = require("express");
const app = express();
const { generateLeaderboard } = require("./functions/generateLeaderboard");
const { updateLeaderboardJob } = require("./jobs/updateOSLeaderboard");
const { generateCALeaderboard } = require("./functions/generateCALeaderboard");
const { updateCALeaderboardJob } = require("./jobs/updateCALeaderboard");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
//   generateLeaderboard();
//   updateLeaderboardJob();
generateCALeaderboard();
updateCALeaderboardJob();
let default_json = {
  leaderboard: [],
  success: true,
  updatedAt: null,
  generated: false,
};
// fs.writeFile(
//   "leaderboard.json",
//   JSON.stringify(default_json),
//   "utf8",
//   function (err) {
//     if (err) throw err;
//     console.log("leaderboard.json was reset");
//   }
// );
fs.writeFile(
  "caLeaderboard.json",
  JSON.stringify(default_json),
  "utf8",
  function (err) {
    if (err) throw err;
    console.log("caLeaderboard.json was reset");
  }
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/OSLeaderboard", (req, res) => {
  console.log("got the request");
  fs.readFile("leaderboard.json", "utf8", function (err, data) {
    if (err) throw err;
    console.log("sending response");
    let obj = JSON.parse(data);
    res.send(obj);
  });
});
app.get("/CALeaderboard", (req, res) => {
  console.log("got the request");
  fs.readFile("caLeaderboard.json", "utf8", function (err, data) {
    if (err) throw err;
    console.log("sending response");
    let obj = JSON.parse(data);
    res.send(obj);
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server started on port ${port}`);
});
