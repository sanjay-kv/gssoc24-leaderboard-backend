var fs = require("fs");
var axios = require("axios");
require("dotenv").config();

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
let leaderboard = {};

async function generateLeaderboard() {
  try {
    let response = await axios.get(
      "https://opensheet.elk.sh/1JiqHjGyf43NNkou4PBe7WT4KEyueuFJct2p322nNMNw/JSON"
    );
    let projects = response.data;

    leaderboard = {};
    let labels = [
      { label: "level1", points: 10 },
      { label: "level2", points: 25 },
      { label: "level3", points: 45 },
    ];

    for (let m = 0; m < projects.length; m++) {
      let projectLink = projects[m].project_link
        .split("/")
        .slice(3, 5)
        .join("/");

      await processDateRange(projectLink, "2024-05-10", "2024-07-31", labels);

      console.log(`Completed ${m + 1} of ${projects.length}`);
      await timer(10000);
    }

    finalizeLeaderboard();
  } catch (error) {
    console.error("Error generating leaderboard:", error);
  }
}

async function processDateRange(projectLink, startDate, endDate, labels) {
  try {
    let totalPRs = await fetchTotalPRs(projectLink, "2024-05-10", "2024-07-31");
    console.log("total", totalPRs, projectLink);
    if (totalPRs > 1000) {
      let splitDateRanges = splitDateRange(startDate, endDate);
      for (let splitDateRange of splitDateRanges) {
        await fetchPRsForDateRange(
          projectLink,
          splitDateRange.start,
          splitDateRange.end,
          labels
        );
      }
    } else {
      if (totalPRs > 0) {
        await fetchPRsForDateRange(projectLink, startDate, endDate, labels);
      }
    }
  } catch (error) {
    console.error("Error processing date range:", error);
  }
}

async function fetchTotalPRs(projectLink, startDate, endDate) {
  try {
    let response = await axios.get(
      `https://api.github.com/search/issues?q=repo:${projectLink}+is:pr+label:gssoc24,GSSoC24,GSSOC'24,gssoc+is:merged+closed:${startDate}..${endDate}&per_page=100`,
      {
        headers: {
          Authorization: "token " + process.env.GIT_TOKEN,
        },
      }
    );
    return response.data.total_count;
  } catch (error) {
    console.error("Error fetching total PRs:", error);
    return 0;
  }
}

async function fetchPRsForDateRange(projectLink, startDate, endDate, labels) {
  try {
    let response = await axios.get(
      `https://api.github.com/search/issues?q=repo:${projectLink}+is:pr+label:gssoc24,GSSoC24,GSSOC'24,gssoc+is:merged+closed:${startDate}..${endDate}&per_page=100`,
      {
        headers: {
          Authorization: "token " + process.env.GIT_TOKEN,
        },
      }
    );
    let totalPRs = response.data.total_count;
    console.log(totalPRs);
    let pages = Math.ceil(totalPRs / 100);

    for (let i = 1; i <= pages; i++) {
      await processPage(projectLink, startDate, endDate, i, labels);
      await timer(10000);
    }
  } catch (error) {
    console.error("Error fetching PRs for date range:", error);
  }
}

async function processPage(projectLink, startDate, endDate, page, labels) {
  try {
    let response = await axios.get(
      `https://api.github.com/search/issues?q=repo:${projectLink}+is:pr+label:gssoc24,GSSoC24,GSSOC'24,gssoc+is:merged+closed:${startDate}..${endDate}&per_page=100&page=${page}`,
      {
        headers: {
          Authorization: "token " + process.env.GIT_TOKEN,
        },
      }
    );
    console.log("items", response.data.items.length);
    if (response.data.items && response.data.items.length > 0) {
      response.data.items.forEach((pr) => {
        processPR(pr, labels);
      });
    }
  } catch (error) {
    console.error("Error processing page:", error);
  }
}

function processPR(pr, labels) {
  pr.labels.forEach((label) => {
    let userId = pr.user.id;
    if (!leaderboard[userId]) {
      leaderboard[userId] = {
        avatar_url: pr.user.avatar_url,
        login: pr.user.login,
        url: pr.user.html_url,
        score: 0,
        postManTag: false,
        pr_urls: [],
      };
    }
    if (
      label.name.toLowerCase() === "postman" &&
      !leaderboard[userId].postManTag
    ) {
      leaderboard[userId].postManTag = true;
      leaderboard[userId].score += 500;
    }
    if (!leaderboard[userId].pr_urls.includes(pr.html_url)) {
      leaderboard[userId].pr_urls.push(pr.html_url);
      let labelObj = labels.find((l) => l.label === label.name);
      if (labelObj) {
        leaderboard[userId].score += labelObj.points;
      }
    }
  });
}

function splitDateRange(start, end) {
  let startDate = new Date(start);
  let endDate = new Date(end);

  // Calculate the 75% point in milliseconds
  let duration = endDate.getTime() - startDate.getTime();
  let seventyFivePercentDate = new Date(startDate.getTime() + duration * 0.75);

  return [
    { start: start, end: seventyFivePercentDate.toISOString().split("T")[0] },
    { start: seventyFivePercentDate.toISOString().split("T")[0], end: end },
  ];
  // let startDate = new Date(start);
  // let endDate = new Date(end);
  // let midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);

  // return [
  //   { start: start, end: midDate.toISOString().split("T")[0] },
  //   { start: midDate.toISOString().split("T")[0], end: end },
  // ];
}

function finalizeLeaderboard() {
  let leaderboardArray = Object.values(leaderboard).sort(
    (a, b) => b.score - a.score
  );
  let json = {
    leaderboard: leaderboardArray,
    success: true,
    updatedAt: Date.now(),
    generated: true,
    updatedTimestring:
      new Date().toLocaleString() +
      " No New PRs merged after 31st July 11:59p.m are counted",
  };

  fs.writeFile(
    "leaderboard.json",
    JSON.stringify(json, null, 2),
    "utf8",
    (err) => {
      if (err) throw err;
      console.log("leaderboard.json was updated");
    }
  );
}

module.exports = generateLeaderboard;
