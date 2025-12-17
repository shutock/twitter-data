import ora from "ora";

const BASE_URL = "http://localhost:1337";

type XDataResponse = {
  profile: {
    username: string;
    name?: string;
    bio?: string;
    profile_link: string;
    profile_photo_url?: string;
    cover_photo_url?: string;
    registration_date: string;
    verification?: "blue" | "business";
  };
  stats: {
    tweets: number;
    following: number;
    followers: number;
    likes: number;
  };
  tweets: Array<{
    author: {
      username: string;
      name?: string;
      profile_photo_url?: string;
      verification?: "blue" | "business";
    };
    content: string;
    url: string;
    created_at: string;
    metrics: {
      comments: number;
      retweets: number;
      quotes: number;
      likes: number;
      views: number;
    };
    kind: "tweet" | "retweet" | "quote";
  }>;
  metadata: {
    requested: number;
    collected: number;
    status: string;
    instance: string;
    attempts?: number;
  };
  error?: string;
};

type HealthResponse = {
  status: string;
  timestamp: string;
  uptime: number;
  nitterInstances: {
    total: number;
    healthy: number;
    instances: Array<{
      url: string;
      status: string;
      lastCheck: string;
    }>;
  };
  browserPool: {
    completedTasks: number;
    failedTasks: number;
  };
};

console.log("🧪 Production Validation Suite\n");

console.log("Test 1: Multi-instance retry & concurrent requests");
const usernames = ["0xNomis", "unchase12", "nasa", "eeftp", "artyshatilov"];
const tweetsLimit = 100;

const spinner = ora(
  `Testing concurrent requests for ${usernames.length} users...`,
).start();

const startTime = Date.now();

const results = await Promise.all(
  usernames.map(async (username) => {
    try {
      const url = new URL(`x-data/${username}`, BASE_URL);
      url.searchParams.append("tweetsLimit", tweetsLimit.toString());
      const res = await fetch(url);
      const data = (await res.json()) as XDataResponse;

      if (data.error) {
        return {
          username,
          status: "error",
          error: data.error,
          metadata: data.metadata,
        };
      }

      return {
        username,
        status: res.status === 206 ? "partial" : "complete",
        collected: data.tweets.length,
        requested: tweetsLimit,
        metadata: data.metadata,
      };
    } catch (error) {
      return {
        username,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        metadata: undefined,
      };
    }
  }),
);

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
spinner.succeed(`Requests completed in ${duration}s`);

console.log(`\n📊 Results:`);

results.forEach((item) => {
  if (item.status === "error") {
    console.log(
      `  ❌ ${item.username}: ERROR - ${item.error} (attempts: ${item.metadata?.attempts || "N/A"})`,
    );
  } else {
    const attempts = item.metadata?.attempts || 1;
    const instance = item.metadata?.instance || "unknown";
    const shortInstance = instance.split("//")[1]?.split("/")[0] || instance;
    const statusEmoji = item.status === "partial" ? "⚠️" : "✅";

    console.log(
      `  ${statusEmoji} ${item.username}: ${item.collected}/${item.requested} (status: ${item.status}, instance: ${shortInstance}, attempts: ${attempts})`,
    );
  }
});

const successful = results.filter((r) => r.status !== "error").length;
const successRate = ((successful / results.length) * 100).toFixed(1);
console.log(
  `\n✅ Success Rate: ${successful}/${results.length} (${successRate}%)`,
);

console.log("\n\nTest 2: Username validation");
const invalidUsernames = ["user@domain", "user-with-dash", "a".repeat(20)];

for (const invalidUser of invalidUsernames) {
  const spinner = ora(`Testing invalid user: ${invalidUser}`).start();
  const url = new URL(`x-data/${encodeURIComponent(invalidUser)}`, BASE_URL);
  const res = await fetch(url);

  if (res.status === 400) {
    spinner.succeed(`"${invalidUser}" rejected (400)`);
  } else {
    spinner.fail(`"${invalidUser}" accepted (should be rejected!)`);
  }
}

console.log("\n\nTest 3: Query parameter validation");
const invalidParams = [
  { tweetsLimit: 10000, expected: "rejected" },
  { tweetsLimit: 0, expected: "rejected" },
  { delayBetweenPages: 500, expected: "rejected" },
];

for (const params of invalidParams) {
  const spinner = ora(`Testing params: ${JSON.stringify(params)}`).start();
  const url = new URL("x-data/nasa", BASE_URL);
  if (params.tweetsLimit !== undefined)
    url.searchParams.append("tweetsLimit", String(params.tweetsLimit));
  if (params.delayBetweenPages !== undefined)
    url.searchParams.append(
      "delayBetweenPages",
      String(params.delayBetweenPages),
    );

  const res = await fetch(url);
  const status = res.status === 400 ? "rejected" : "accepted";

  if (status === params.expected) {
    spinner.succeed(`${JSON.stringify(params)} → ${status}`);
  } else {
    spinner.fail(
      `${JSON.stringify(params)} → ${status} (expected ${params.expected})`,
    );
  }
}

console.log("\n\nTest 4: Health endpoint");
const healthSpinner = ora("Checking health endpoint...").start();
const healthRes = await fetch(`${BASE_URL}/health`);
const healthData = (await healthRes.json()) as HealthResponse;
healthSpinner.succeed(`Status: ${healthData.status}`);

console.log(
  `  Instances: ${healthData.nitterInstances.healthy}/${healthData.nitterInstances.total} healthy`,
);
console.log(
  `  Browser Pool: ${healthData.browserPool.completedTasks} completed, ${healthData.browserPool.failedTasks} failed`,
);

console.log("\n✅ All tests complete!");
