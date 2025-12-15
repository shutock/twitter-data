import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Hono } from "hono";

import {
  DELAY_BETWEEN_PAGES,
  MAX_RETRIES,
  POSTS_LIMIT,
} from "~/src/lib/constants";
import { createRateLimiter } from "~/src/lib/rate-limiter";

import { getXData } from "./get-x-data";

export const app = new Hono();

// Limiter for concurrent scraping jobs (system resources)
const jobLimiter = createRateLimiter({
  maxConcurrent: 5,
  requestsPerSecond: 100, // High limit, effectively just semaphore
  timeout: 600000, // 10 minutes for a job
  onQueueChange: (queueSize) => {
    if (queueSize > 0) {
      console.log(`[JobLimiter] Queue size: ${queueSize}`);
    }
  },
});

// Limiter for Nitter API requests (rate limits)
const nitterLimiter = createRateLimiter({
  requestsPerSecond: 2,
  maxConcurrent: 2, // Per session limit
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 120000,
  onError: (error, retries) => {
    console.error(`[NitterLimiter] Error (retry ${retries}):`, error.message);
  },
  onSuccess: (duration) => {
    console.log(`[NitterLimiter] Request completed in ${duration}ms`);
  },
  onQueueChange: (queueSize) => {
    if (queueSize > 0) {
      console.log(`[NitterLimiter] Queue size: ${queueSize}`);
    }
  },
});

app.get("/metrics", (c) => {
  const nitterMetrics = nitterLimiter.getMetrics();
  const jobMetrics = jobLimiter.getMetrics();

  return c.json({
    nitter: {
      ...nitterMetrics,
      queueSize: nitterLimiter.getQueueSize(),
      activeRequests: nitterLimiter.getActiveRequests(),
    },
    jobs: {
      ...jobMetrics,
      queueSize: jobLimiter.getQueueSize(),
      activeRequests: jobLimiter.getActiveRequests(),
    },
  });
});

app.get("/:username", async (c) => {
  const username = c.req.param("username");
  const postsLimit = Number(c.req.query("postsLimit") || POSTS_LIMIT);
  const delayBetweenPages = Number(
    c.req.query("delayBetweenPages") || DELAY_BETWEEN_PAGES,
  );
  const maxRetries = Number(c.req.query("maxRetries") || MAX_RETRIES);

  try {
    const data = await jobLimiter.execute(async () => {
      return await getXData(username, {
        postsLimit,
        delayBetweenPages,
        maxRetries,
        rateLimiter: nitterLimiter,
      });
    }, 1);

    const outDir = path.join(process.cwd(), "out");
    await fs.mkdir(outDir, { recursive: true });

    const outFile = path.join(outDir, `${username}.json`);
    await fs.writeFile(outFile, JSON.stringify(data, null, 2), "utf8");

    return c.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});
