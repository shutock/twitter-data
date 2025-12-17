import ora from "ora";

type HealthResponse = {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  nitterInstances: {
    total: number;
    healthy: number;
    instances: Array<{
      url: string;
      status: "healthy" | "unhealthy" | "rate_limited";
      consecutiveFailures: number;
      avgResponseTime: number;
      rateLimitedUntil: string | null;
    }>;
  };
  browserPool: {
    workerCount: number;
    completedTasks: number;
    failedTasks: number;
  };
};

type MetricsResponse = {
  nitter: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    retriedRequests: number;
    averageResponseTime: number;
    currentQueueSize: number;
    activeRequests: number;
    queueSize: number;
  };
  jobs: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    retriedRequests: number;
    averageResponseTime: number;
    currentQueueSize: number;
    activeRequests: number;
  };
};

const BASE_URL = "http://localhost:1337";

console.log("🏥 Testing Health & Metrics Endpoints\n");

const healthSpinner = ora("Checking health endpoint...").start();

try {
  const healthResponse = await fetch(`${BASE_URL}/health`);
  const health = (await healthResponse.json()) as HealthResponse;

  healthSpinner.succeed(
    `Health check: ${health.status} (${healthResponse.status} ${healthResponse.statusText})`,
  );

  console.log(`\n📊 Service Health:`);
  console.log(`  Overall Status: ${health.status}`);
  console.log(`  Uptime: ${Math.floor(health.uptime)}s`);
  console.log(`  Timestamp: ${health.timestamp}`);

  console.log(`\n🌐 Nitter Instances:`);
  console.log(
    `  Total: ${health.nitterInstances.total} | Healthy: ${health.nitterInstances.healthy}`,
  );

  health.nitterInstances.instances.forEach((instance, index) => {
    const statusIcon =
      instance.status === "healthy"
        ? "✅"
        : instance.status === "rate_limited"
          ? "⏱️"
          : "❌";
    console.log(`\n  ${statusIcon} Instance ${index + 1}:`);
    console.log(`    URL: ${instance.url}`);
    console.log(`    Status: ${instance.status}`);
    console.log(`    Avg Response: ${instance.avgResponseTime}ms`);
    console.log(`    Failures: ${instance.consecutiveFailures}`);
    if (instance.rateLimitedUntil) {
      console.log(`    Rate Limited Until: ${instance.rateLimitedUntil}`);
    }
  });

  console.log(`\n🌐 Browser Pool:`);
  console.log(`  Workers: ${health.browserPool.workerCount}`);
  console.log(`  Completed Tasks: ${health.browserPool.completedTasks}`);
  console.log(`  Failed Tasks: ${health.browserPool.failedTasks}`);
  console.log(
    `  Success Rate: ${((health.browserPool.completedTasks / (health.browserPool.completedTasks + health.browserPool.failedTasks)) * 100).toFixed(1)}%`,
  );
} catch (error) {
  healthSpinner.fail(
    `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
  );
}

console.log("\n");
const metricsSpinner = ora("Checking metrics endpoint...").start();

try {
  const metricsResponse = await fetch(`${BASE_URL}/metrics`);
  const metrics = (await metricsResponse.json()) as MetricsResponse;

  metricsSpinner.succeed(
    `Metrics check: ${metricsResponse.status} ${metricsResponse.statusText}`,
  );

  console.log(`\n📈 Nitter Rate Limiter Metrics:`);
  console.log(`  Total Requests: ${metrics.nitter.totalRequests}`);
  console.log(`  Successful: ${metrics.nitter.successfulRequests}`);
  console.log(`  Failed: ${metrics.nitter.failedRequests}`);
  console.log(`  Retried: ${metrics.nitter.retriedRequests}`);
  console.log(
    `  Success Rate: ${((metrics.nitter.successfulRequests / metrics.nitter.totalRequests) * 100).toFixed(1)}%`,
  );
  console.log(
    `  Avg Response Time: ${metrics.nitter.averageResponseTime.toFixed(2)}ms`,
  );
  console.log(`  Active Requests: ${metrics.nitter.activeRequests}`);
  console.log(`  Queue Size: ${metrics.nitter.queueSize}`);

  console.log(`\n📈 Job Limiter Metrics:`);
  console.log(`  Total Requests: ${metrics.jobs.totalRequests}`);
  console.log(`  Successful: ${metrics.jobs.successfulRequests}`);
  console.log(`  Failed: ${metrics.jobs.failedRequests}`);
  console.log(`  Retried: ${metrics.jobs.retriedRequests}`);
  console.log(
    `  Success Rate: ${((metrics.jobs.successfulRequests / metrics.jobs.totalRequests) * 100).toFixed(1)}%`,
  );
  console.log(
    `  Avg Response Time: ${(metrics.jobs.averageResponseTime / 1000).toFixed(2)}s`,
  );
  console.log(`  Active Requests: ${metrics.jobs.activeRequests}`);
  console.log(`  Queue Size: ${metrics.jobs.currentQueueSize}`);
} catch (error) {
  metricsSpinner.fail(
    `Metrics check failed: ${error instanceof Error ? error.message : String(error)}`,
  );
}

console.log("\n✅ Health & Metrics check complete!");
