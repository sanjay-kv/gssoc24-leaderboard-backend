var fs = require("fs");
var axios = require("axios");
const { type } = require("os");
require("dotenv").config();
const logStream = fs.createWriteStream("debug.log", { flags: "a" });
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
let leaderboard = {};

async function generateLeaderboard() {
  let projects = await axios.get(
    `https://opensheet.elk.sh/1JiqHjGyf43NNkou4PBe7WT4KEyueuFJct2p322nNMNw/JSON`
  );
  leaderboard = {};
  projects = projects.data;
  let identifyingLabel = "gssoc23";
  let labels = [
    {
      label: "level1",
      points: 10,
    },
    {
      label: "level2",
      points: 25,
    },
    {
      label: "level3",
      points: 45,
    },
  ];
  let dateRanges;
  for (let m = 0; m < projects.length; m++) {
    let projectLink = projects[m].project_link;
    projects[m].project_link =
      projects[m].project_link.split("/")[3] +
      "/" +
      (projects[m].project_link.split("/")[4]
        ? projects[m].project_link.split("/")[4]
        : "");
    if (projects[m].project_link == "GSSoC24/Postman-Challenge") {
      dateRanges = [
        { startDate: "2024-07-17", endDate: "2024-07-28" },
        { startDate: "2024-07-29", endDate: "2024-07-31" },
      ];
    } else {
      dateRanges = [
        { start: "2024-05-10", end: "2024-05-31" },
        { start: "2024-06-01", end: "2024-06-30" },
        { start: "2024-07-01", end: "2024-07-31" },
      ];
    }

    for (let dateRange of dateRanges) {
      await axios
        .get(
          `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC24,GSSOC'24,gssoc,level1,level2,level3+is:merged+closed:${dateRange.start}..${dateRange.end}&per_page=100`,
          {
            headers: {
              Authorization: "token " + process.env.GIT_TOKEN,
            },
          }
        )
        .then(async function (response) {
          if (response.data.items && response.data.items.length > 0) {
            let prs = response.data.items;
            //console.log(prs);
            for (let i = 0; i < prs.length; i++) {
              for (let j = 0; j < prs[i].labels.length; j++) {
                if (!leaderboard[prs[i].user.id]) {
                  leaderboard[prs[i].user.id] = {
                    avatar_url: prs[i].user.avatar_url,
                    login: prs[i].user.login,
                    url: prs[i].user.html_url,
                    score: 0,
                    postManTag: false,
                    pr_urls: [],
                  };
                }
                if (
                  prs[i].labels[j].name.toLowerCase() === "postman" &&
                  leaderboard[prs[i].user.id].postManTag == false
                ) {
                  leaderboard[prs[i].user.id].postManTag = true;
                  leaderboard[prs[i].user.id].score += 500;
                  logStream.write(
                    `user: ${prs[i].user.login} pr: ${prs[i].html_url} label: ${
                      prs[i].labels[j].name
                    } points: ${leaderboard[prs[i].user.id].score} \n`
                  );
                }
                if (
                  leaderboard[prs[i].user.id].pr_urls.indexOf(
                    prs[i].html_url
                  ) == -1
                ) {
                  leaderboard[prs[i].user.id].pr_urls.push(prs[i].html_url);
                }
                let obj = labels.find((o) => o.label === prs[i].labels[j].name);
                if (obj) {
                  leaderboard[prs[i].user.id].score += obj.points;
                  logStream.write(
                    `user: ${prs[i].user.login} pr: ${prs[i].html_url} label: ${
                      prs[i].labels[j].name
                    } points: ${leaderboard[prs[i].user.id].score} \n`
                  );
                }
              }
            }
            if (response.data.total_count > 200) {
              //calculate number of pages
              let pages = Math.ceil(response.data.total_count / 200);
              console.log("========");
              console.log("No. of pages: " + pages);
              console.log(
                `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC24,GSSOC'24,gssoc,level1,level2,level3+is:merged+closed:${dateRange.start}..${dateRange.end}&per_page=100`
              );
              console.log("========");
              for (let i = 2; i <= pages; i++) {
                console.log("Page: " + i);

                let paginated = await axios
                  .get(
                    `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC24,GSSOC'24,gssoc,level1,level2,level3+is:merged+closed:${dateRange.start}..${dateRange.end}&per_page=100&page=${i}`,
                    {
                      headers: {
                        Authorization: "token " + process.env.GIT_TOKEN,
                      },
                    }
                  )
                  .then(async function (response) {
                    console.log("*****" + response.data.items.length);
                    if (response.data.items && response.data.items.length > 0) {
                      let prs = response.data.items;
                      for (let i = 0; i < prs.length; i++) {
                        for (let j = 0; j < prs[i].labels.length; j++) {
                          if (!leaderboard[prs[i].user.id]) {
                            leaderboard[prs[i].user.id] = {
                              avatar_url: prs[i].user.avatar_url,
                              login: prs[i].user.login,
                              url: prs[i].user.html_url,
                              score: 0,
                              pr_urls: [],
                            };
                          }
                          if (
                            prs[i].labels[j].name.toLowerCase() === "postman" &&
                            leaderboard[prs[i].user.id].postManTag == false
                          ) {
                            leaderboard[prs[i].user.id].postManTag = true;
                            leaderboard[prs[i].user.id].score += 500;
                            logStream.write(
                              `user: ${prs[i].user.login} pr: ${
                                prs[i].html_url
                              } label: ${prs[i].labels[j].name} points: ${
                                leaderboard[prs[i].user.id].score
                              } \n`
                            );
                          }
                          if (
                            leaderboard[prs[i].user.id].pr_urls.indexOf(
                              prs[i].html_url
                            ) == -1
                          ) {
                            leaderboard[prs[i].user.id].pr_urls.push(
                              prs[i].html_url
                            );
                          }
                          let obj = labels.find(
                            (o) => o.label == prs[i].labels[j].name
                          );
                          if (obj) {
                            leaderboard[prs[i].user.id].score += obj.points;
                            logStream.write(
                              `user: ${prs[i].user.login} pr: ${
                                prs[i].html_url
                              } label: ${prs[i].labels[j].name} points: ${
                                leaderboard[prs[i].user.id].score
                              } \n`
                            );
                          }
                        }
                      }
                    }
                    console.log("Completed page: " + i);
                  });
                await timer(10000);
              }
            }
          }
        })
        .catch(function (err) {
          console.log(
            "Not found for this project link ",
            projects[m].project_link
          );
        });
    }
    console.log("Completed " + (m + 1) + " of " + projects.length);
    await timer(10000);
  }
  // wait for all the prs to be fetched
  console.log("Leaderboard generated");
  //sort the leaderboard by score
  let leaderboardArray = Object.keys(leaderboard).map(
    (key) => leaderboard[key]
  );
  leaderboardArray.sort((a, b) => b.score - a.score);
  let json = {
    leaderboard: leaderboardArray,
    success: true,
    updatedAt: +new Date(),
    generated: true,
    updatedTimestring:
      new Date().toLocaleString() +
      " No New PRs merged after 31st July 11:59p.m are counted",
  };
  fs.truncate("leaderboard.json", 0, function () {
    console.log("done");
  });
  fs.writeFile(
    "leaderboard.json",
    JSON.stringify(json),
    "utf8",
    function (err) {
      if (err) throw err;
      console.log("leaderboard.json was updated");
    }
  );
}

module.exports = generateLeaderboard;
