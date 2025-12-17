import ora from "ora";

type XDataResponse = {
  profile: {
    username: string;
    name?: string;
  };
  stats: {
    tweets: number;
    following: number;
    followers: number;
    likes: number;
  };
  tweets: Array<{
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
  }>;
  metadata: {
    requested: number;
    collected: number;
    status: string;
    instance: string;
  };
};

const BASE_URL = "http://localhost:1337";

const usernames = [
  "elonmusk",
  "BillGates",
  "BarackObama",
  "NASA",
  "SpaceX",
  "OpenAI",
  "Google",
  "Microsoft",
  "Apple",
  "Tesla",
];

const postsLimit = 50;

const spinner = ora(
  `Testing concurrent requests for ${usernames.length} users (${postsLimit} posts each)...`,
).start();

const startTime = Date.now();

const results = await Promise.all(
  usernames.map(async (username) => {
    const requestStart = Date.now();

    try {
      const url = new URL(`x-data/${username}`, BASE_URL);
      url.searchParams.append("postsLimit", postsLimit.toString());

      const response = await fetch(url);
      const data = (await response.json()) as XDataResponse;

      const requestDuration = ((Date.now() - requestStart) / 1000).toFixed(2);

      if (!response.ok) {
        return {
          username,
          success: false,
          error: (data as any).error || "Unknown error",
          duration: requestDuration,
        };
      }

      return {
        username,
        success: true,
        tweetsCollected: data.tweets.length,
        instance: data.metadata.instance,
        status: data.metadata.status,
        duration: requestDuration,
      };
    } catch (error) {
      const requestDuration = ((Date.now() - requestStart) / 1000).toFixed(2);
      return {
        username,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: requestDuration,
      };
    }
  }),
);

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

const successful = results.filter((r) => r.success);
const failed = results.filter((r) => !r.success);

spinner.succeed(`All requests completed in ${totalDuration}s`);

console.log(`📈 Results Summary:`);
console.log(`  Total Requests: ${results.length}`);
console.log(`  Successful: ${successful.length}`);
console.log(`  Failed: ${failed.length}`);
console.log(
  `  Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`,
);

if (successful.length > 0) {
  const avgDuration =
    successful.reduce((sum, r) => sum + parseFloat(r.duration), 0) /
    successful.length;
  const totalTweets = successful.reduce(
    (sum, r) => sum + (r.tweetsCollected || 0),
    0,
  );

  console.log(`\n⚡ Performance:`);
  console.log(`  Avg Response Time: ${avgDuration.toFixed(2)}s`);
  console.log(`  Total Tweets Collected: ${totalTweets}`);
  console.log(
    `  Tweets per Second: ${(totalTweets / parseFloat(totalDuration)).toFixed(2)}`,
  );
}

console.log(`\n📋 Detailed Results:`);
results.forEach((result) => {
  if (result.success) {
    console.log(
      `  ✓ @${result.username}: ${result.tweetsCollected} tweets (${result.duration}s) [${result.instance}]`,
    );
  } else {
    console.log(
      `  ✗ @${result.username}: ${result.error} (${result.duration}s)`,
    );
  }
});

if (failed.length > 0) {
  console.log(`\n❌ Failed Requests:`);
  failed.forEach((result) => {
    console.log(`  @${result.username}: ${result.error}`);
  });
}
