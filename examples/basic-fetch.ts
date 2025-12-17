import ora from "ora";

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
  };
};

const BASE_URL = "http://localhost:1337";

const username = "elonmusk";
const postsLimit = 100;

const spinner = ora(
  `Fetching ${postsLimit} tweets from @${username}...`,
).start();

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

  spinner.succeed(`Success! (${duration}s)`);

  console.log(`\n📊 Profile:`);
  console.log(`  Username: @${data.profile.username}`);
  console.log(`  Name: ${data.profile.name}`);
  console.log(`  Followers: ${data.stats.followers.toLocaleString()}`);
  console.log(`  Following: ${data.stats.following.toLocaleString()}`);
  console.log(`  Total Tweets: ${data.stats.tweets.toLocaleString()}`);

  console.log(`\n📝 Tweets Collected:`);
  console.log(`  Requested: ${data.metadata.requested}`);
  console.log(`  Collected: ${data.metadata.collected}`);
  console.log(`  Status: ${data.metadata.status}`);
  console.log(`  Instance: ${data.metadata.instance}`);

  if (data.tweets.length > 0) {
    console.log(`\n🐦 Latest Tweet:`);
    const latest = data.tweets[0]!;
    console.log(`  "${latest.content.substring(0, 100)}..."`);
    console.log(`  Likes: ${latest.metrics.likes.toLocaleString()}`);
    console.log(`  Retweets: ${latest.metrics.retweets.toLocaleString()}`);
    console.log(`  Date: ${latest.created_at}`);
  }
} catch (error) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  spinner.fail(`Request failed after ${duration}s`);
  console.error(
    `Error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
