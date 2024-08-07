var fs = require("fs");
var axios = require("axios");
const { type } = require("os");
require("dotenv").config();
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
let leaderboard = {};

const leaderboardData = async (
  response,
  leaderboard,
  project_link,
  labels,
  start,
  end
) => {
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
        }
        if (
          leaderboard[prs[i].user.id].pr_urls.indexOf(prs[i].html_url) == -1
        ) {
          leaderboard[prs[i].user.id].pr_urls.push(prs[i].html_url);
        }
        let obj = labels.find((o) => o.label === prs[i].labels[j].name);
        if (obj) {
          leaderboard[prs[i].user.id].score += obj.points;
        }
      }
    }
    if (response.data.total_count > 100) {
      //calculate number of pages
      let pages = Math.ceil(response.data.total_count / 100);
      console.log("========");
      console.log("No. of pages: " + pages);
      console.log(
        `https://api.github.com/search/issues?q=repo:${project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:${start}..${end}&per_page=100`
      );
      console.log("========");
      for (let i = 2; i <= pages; i++) {
        console.log("Page: " + i);
        let paginated = await axios
          .get(
            `https://api.github.com/search/issues?q=repo:${project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:${start}..${end}&per_page=100&page=${i}`,
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
                      postManTag: false,
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
                  }
                  if (
                    leaderboard[prs[i].user.id].pr_urls.indexOf(
                      prs[i].html_url
                    ) == -1
                  ) {
                    leaderboard[prs[i].user.id].pr_urls.push(prs[i].html_url);
                  }
                  let obj = labels.find(
                    (o) => o.label === prs[i].labels[j].name
                  );
                  if (obj) {
                    leaderboard[prs[i].user.id].score += obj.points;
                  }
                }
              }
            }
            console.log("Completed page: " + (i + 1));
          });
        await timer(10000);
      }
    }
  }
};

async function generateLeaderboard() {
  let projects = await axios.get(
    `https://opensheet.elk.sh/1JiqHjGyf43NNkou4PBe7WT4KEyueuFJct2p322nNMNw/JSON`
  );
  leaderboard = {};
  projects = projects.data;
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
  for (let m = 0; m < projects.length; m++) {
    let projectLink = projects[m].project_link;
    projects[m].project_link =
      projects[m].project_link.split("/")[3] +
      "/" +
      (projects[m].project_link.split("/")[4]
        ? projects[m].project_link.split("/")[4]
        : "");
        console.log(projects[m].project_link)
    await axios
      .get(
        `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-05-10..2024-08-10T18:59:59Z&per_page=100`,
        {
          headers: {
            Authorization: "token " + process.env.GIT_TOKEN,
          },
        }
      )
      .then(async function (response) {
        if (response.data.total_count > 1000) {
          if (projects[m].project_link == "GSSoC24/Postman-Challenge") {
            if (
              response.data.total_count > 2000 &&
              response.data.total_count <= 3000
            ) {
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-07-25..2024-07-31&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-07-25",
                    "2024-07-31"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-08-01..2024-08-10T18:59:59Z&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-08-01",
                    "2024-08-10T18:59:59Z"
                  );
                });
            } else if (
              response.data.total_count > 2000 &&
              response.data.total_count <= 3000
            ) {
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-07-25..2024-07-31&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-07-25",
                    "2024-07-31"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-08-01..2024-08-06&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-08-01",
                    "2024-08-06"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-08-07..2024-08-10T18:59:59Z&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-08-07",
                    "2024-08-10T18:59:59Z"
                  );
                });
            }
          } else {
            if (
              response.data.total_count > 1000 &&
              response.data.total_count <= 2000
            ) {
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-05-10..2024-06-25&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-05-10",
                    "2024-06-25"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-06-26..2024-08-10T18:59:59Z&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-06-26",
                    "2024-08-10T18:59:59Z"
                  );
                });
            } else if (
              response.data.total_count > 2000 &&
              response.data.total_count <= 3000
            ) {
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-05-10..2024-06-25&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-05-10",
                    "2024-06-25"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-06-26..2024-07-30&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-06-26",
                    "2024-07-30"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-07-31..2024-08-10T18:59:59Z&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-07-31",
                    "2024-08-10T18:59:59Z"
                  );
                });
            } else if (
              response.data.total_count > 3000 &&
              response.data.total_count <= 4000
            ) {
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-05-10..2024-06-25&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-05-10",
                    "2024-06-25"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-06-26..2024-07-30&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-06-26",
                    "2024-07-30"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-07-31..2024-08-05&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-07-31",
                    "2024-08-05"
                  );
                });
              await axios
                .get(
                  `https://api.github.com/search/issues?q=repo:${projects[m].project_link}+is:pr+label:gssoc24,GSSoC'24,gssoc+is:merged+closed:2024-08-06..2024-08-10T18:59:59Z&per_page=100`,
                  {
                    headers: {
                      Authorization: "token " + process.env.GIT_TOKEN,
                    },
                  }
                )
                .then(async function (response) {
                  await leaderboardData(
                    response,
                    leaderboard,
                    projects[m].project_link,
                    labels,
                    "2024-08-06",
                    "2024-08-10T18:59:59Z"
                  );
                });
            }
          }
        } else {
          await leaderboardData(
            response,
            leaderboard,
            projects[m].project_link,
            labels,
            "2024-05-10",
            "2024-08-10T18:59:59Z"
          );
        }
      })
      .catch(async function (err) {
        if (
          err.response &&
          err.response.status === 403 &&
          err.response.headers["x-ratelimit-reset"]
        ) {
          const resetTime = new Date(
            err.response.headers["x-ratelimit-reset"] * 1000
          );
          const waitTime = resetTime - new Date();
          if (waitTime > 0) {
            console.log(
              `Rate limit exceeded. Waiting for ${
                waitTime / 1000 / 60
              } minutes.`
            );
            await timer(waitTime);
          }
        }
        console.log("Not found for this project link ", projects[m].project_link);
      });
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
      " No New PRs merged after 10th August 7:00p.m are counted",
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
module.exports.generateLeaderboard = generateLeaderboard;
