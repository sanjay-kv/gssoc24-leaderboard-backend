var fs = require("fs");
var axios = require("axios");
require("dotenv").config();
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
let leaderboard = {};

const getGraphQLQuery = (repoOwner, repoName, start, end, cursor = null) => {
  return `
    query {
      search(query: "repo:${repoOwner}/${repoName} is:pr is:merged label:gssoc-ext merged:${start}..${end}", type: ISSUE, first: 100, after: ${
    cursor ? `"${cursor}"` : "null"
  }) {
        issueCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            ... on PullRequest {
              title
              url
              createdAt
              author {
                login
                avatarUrl
                url
              }
              labels(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
};

const leaderboardData = async (response, leaderboard, labels) => {
  if (
    response.data.data.search.edges &&
    response.data.data.search.edges.length > 0
  ) {
    let prs = response.data.data.search.edges;
    for (let i = 0; i < prs.length; i++) {
      let pr = prs[i].node;
      let userId = pr.author?.login;
      if (userId) {
        // Initialize user in leaderboard if not already present
        if (!leaderboard[userId]) {
          leaderboard[userId] = {
            avatar_url: pr.author.avatarUrl,
            login: pr.author?.login,
            url: pr.author.url,
            score: 0,
            postManTag: false,
            web3hack: false,
            pr_urls: [],
            pr_dates: [], // Store PR dates here
            streak: 0,
          };
        }

        // Track PR labels for scoring
        let prLabels = pr.labels.edges.map((labelEdge) => labelEdge.node.name);
        prLabels.forEach((label) => {
          let labelObj = labels.find(
            (o) => o.label.toLowerCase() === label.toLowerCase()
          );
          if (labelObj) {
            leaderboard[userId].score += labelObj.points;
          }
        });

        // Track PR URLs to avoid duplicates
        if (!leaderboard[userId].pr_urls.includes(pr.url)) {
          leaderboard[userId].pr_urls.push(pr.url);
        }

        // Extra score for postman label
        if (!leaderboard[userId].postManTag && prLabels.includes("postman")) {
          //console.log("Postman tag found for " + leaderboard[userId].score,leaderboard[userId].login,leaderboard[userId].postManTag);
          leaderboard[userId].postManTag = true;
          leaderboard[userId].score += 500;
        }

        if (!leaderboard[userId].web3hack && prLabels.includes("hack-web3")) {
          leaderboard[userId].web3hack = true;
          leaderboard[userId].score += 500;
        }

        // Collect PR submission dates
        let createdAt = new Date(pr.createdAt).toISOString().split("T")[0]; // Store only the date part
        if (!leaderboard[userId].pr_dates.includes(createdAt)) {
          leaderboard[userId].pr_dates.push(createdAt);
        }
      }
    }

    // Calculate streak for each user
    Object.keys(leaderboard).forEach((userId) => {
      let user = leaderboard[userId];

      // Sort PR dates in ascending order
      let sortedDates = user.pr_dates.sort((a, b) => new Date(a) - new Date(b));

      // Reset streak
      user.streak = 1;

      for (let j = 1; j < sortedDates.length; j++) {
        let prevDate = new Date(sortedDates[j - 1]);
        let currDate = new Date(sortedDates[j]);

        // Calculate the difference in days
        let diffInDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

        // Increment streak if PRs are submitted on consecutive days
        if (diffInDays === 1) {
          user.streak += 1;
        } else if (diffInDays > 1) {
          // Reset the streak if there's a gap of more than 1 day
          user.streak = 1;
        }
      }
    });
  }
};

const analyeseData = async (from, to, repoOwner, repoName, leaderboard) => {
  let labels = [
    { label: "level1", points: 10 },
    { label: "level2", points: 25 },
    { label: "level3", points: 45 },
    { label: "level 1", points: 10 },
    { label: "level 2", points: 25 },
    { label: "level 3", points: 45 },
    { label: "level-1", points: 10 },
    { label: "level-2", points: 25 },
    { label: "level-3", points: 45 },
  ];

  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    let query = getGraphQLQuery(repoOwner, repoName, from, to, cursor);

    await axios
      .post(
        "https://api.github.com/graphql",
        { query },
        {
          headers: {
            Authorization: "Bearer " + process.env.GIT_TOKEN,
          },
        }
      )
      .then(async function (response) {
        await leaderboardData(response, leaderboard, labels);

        hasNextPage = response.data.data.search.pageInfo.hasNextPage;
        cursor = response.data.data.search.pageInfo.endCursor;
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
        console.log(
          "Not found for this project link ",
          `${repoOwner}/${repoName}`
        );
        hasNextPage = false;
      });
  }
};

async function generateLeaderboard() {
  let projects = await axios.get(
    "https://opensheet.elk.sh/1dM4gAty0kvjxXjT_UPQZQ6sy8ixcwut8asDM2IDVEss/1"
  );
  leaderboard = {};
  projects = projects.data;

  for (let m = 0; m < projects.length; m++) {
    let projectLink = projects[m].project_link;
    let [repoOwner, repoName] = projectLink.split("/").slice(-2);
    console.log(`${repoOwner}/${repoName}`);
    if ("GSSoC24/Postman-Challenge" == `${repoOwner}/${repoName}`) {
      await analyeseData(
        "2024-10-01",
        "2024-11-01",
        repoOwner,
        repoName,
        leaderboard
      );

      await analyeseData(
        "2024-11-02",
        "2024-11-10T18:59:59Z",
        repoOwner,
        repoName,
        leaderboard
      );
    } else {
      await analyeseData(
        "2024-10-01",
        "2024-11-10T18:59:59Z",
        repoOwner,
        repoName,
        leaderboard
      );
    }

    console.log("Completed " + (m + 1) + " of " + projects.length);
    await timer(10000);
  }

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
      " No New PRs merged after 10th November 7:00p.m are counted",
    streakData: leaderboardArray.map((user) => ({
      login: user?.login,
      streak: user.streak,
    })),
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
