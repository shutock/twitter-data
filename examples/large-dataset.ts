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

const username = "elonmusk";
const postsLimit = 500;

console.log(`🚀 Testing Large Dataset Fetch`);
console.log(`📊 User: @${username}`);
console.log(`📝 Requesting: ${postsLimit} tweets\n`);

const spinner = ora("Fetching... (this may take a while)").start();

const startTime = Date.now();

try {
  const url = new URL(`x-data/${username}`, BASE_URL);
  url.searchParams.append("postsLimit", postsLimit.toString());

  const response = await fetch(url);
  const data = (await response.json()) as XDataResponse;

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!response.ok) {
    spinner.fail(`Error: ${(data as any).error || "Unknown error"}`);
    process.exit(1);
  }

  const statusIcon =
    response.status === 200 ? "✅" : response.status === 206 ? "⚠️" : "❌";

  spinner.succeed(
    `Response: ${response.status} ${response.statusText} (${duration}s)`,
  );

  console.log(`\n📊 Profile:`);
  console.log(`  Username: @${data.profile.username}`);
  console.log(`  Name: ${data.profile.name}`);
  console.log(`  Total Tweets: ${data.stats.tweets.toLocaleString()}`);
  console.log(`  Followers: ${data.stats.followers.toLocaleString()}`);

  console.log(`\n📝 Collection Results:`);
  console.log(`  Requested: ${data.metadata.requested}`);
  console.log(`  Collected: ${data.metadata.collected}`);
  console.log(
    `  Completion: ${((data.metadata.collected / data.metadata.requested) * 100).toFixed(1)}%`,
  );
  console.log(`  Status: ${data.metadata.status}`);
  console.log(`  Instance: ${data.metadata.instance}`);

  if (response.status === 206) {
    console.log(
      `\n⚠️  Partial Results: Request timed out but returned ${data.metadata.collected} tweets`,
    );
  }

  console.log(`\n⚡ Performance:`);
  console.log(
    `  Tweets per Second: ${(data.metadata.collected / parseFloat(duration)).toFixed(2)}`,
  );
  console.log(
    `  Avg Time per Tweet: ${(parseFloat(duration) / data.metadata.collected).toFixed(3)}s`,
  );

  if (data.tweets.length > 0) {
    const totalLikes = data.tweets.reduce(
      (sum, tweet) => sum + tweet.metrics.likes,
      0,
    );
    const totalRetweets = data.tweets.reduce(
      (sum, tweet) => sum + tweet.metrics.retweets,
      0,
    );
    const totalViews = data.tweets.reduce(
      (sum, tweet) => sum + tweet.metrics.views,
      0,
    );

    console.log(`\n📈 Engagement Stats:`);
    console.log(`  Total Likes: ${totalLikes.toLocaleString()}`);
    console.log(`  Total Retweets: ${totalRetweets.toLocaleString()}`);
    console.log(`  Total Views: ${totalViews.toLocaleString()}`);
    console.log(
      `  Avg Likes per Tweet: ${(totalLikes / data.tweets.length).toFixed(0)}`,
    );
    console.log(
      `  Avg Retweets per Tweet: ${(totalRetweets / data.tweets.length).toFixed(0)}`,
    );

    console.log(`\n🐦 Sample Tweets:`);
    const samples = [
      0,
      Math.floor(data.tweets.length / 2),
      data.tweets.length - 1,
    ];
    samples.forEach((index) => {
      const tweet = data.tweets[index]!;
      console.log(`\n  Tweet #${index + 1}:`);
      console.log(`    "${tweet.content.substring(0, 80)}..."`);
      console.log(`    Likes: ${tweet.metrics.likes.toLocaleString()}`);
      console.log(`    Date: ${tweet.created_at}`);
    });
  }

  console.log(`\n✅ Large dataset test complete!`);
} catch (error) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  spinner.fail(`Request failed after ${duration}s`);
  console.error(
    `Error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
