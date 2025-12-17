import ora from "ora";

const BASE_URL = "http://localhost:1337";

type TestCase = {
  name: string;
  url: string;
  expectedStatus: number;
  description: string;
};

const testCases: TestCase[] = [
  {
    name: "Invalid Username (Empty)",
    url: `${BASE_URL}/x-data/`,
    expectedStatus: 404,
    description: "Should return 404 for empty username",
  },
  {
    name: "Invalid Username (Special Chars)",
    url: `${BASE_URL}/x-data/../etc/passwd`,
    expectedStatus: 400,
    description: "Should reject path traversal attempts",
  },
  {
    name: "Invalid postsLimit (Negative)",
    url: `${BASE_URL}/x-data/elonmusk?postsLimit=-100`,
    expectedStatus: 400,
    description: "Should reject negative postsLimit",
  },
  {
    name: "Invalid postsLimit (Zero)",
    url: `${BASE_URL}/x-data/elonmusk?postsLimit=0`,
    expectedStatus: 400,
    description: "Should reject zero postsLimit",
  },
  {
    name: "Invalid postsLimit (Too Large)",
    url: `${BASE_URL}/x-data/elonmusk?postsLimit=10000`,
    expectedStatus: 400,
    description: "Should reject postsLimit > 5000",
  },
  {
    name: "Invalid postsLimit (Non-numeric)",
    url: `${BASE_URL}/x-data/elonmusk?postsLimit=abc`,
    expectedStatus: 400,
    description: "Should reject non-numeric postsLimit",
  },
  {
    name: "Invalid delayBetweenPages (Too Low)",
    url: `${BASE_URL}/x-data/elonmusk?delayBetweenPages=500`,
    expectedStatus: 400,
    description: "Should reject delayBetweenPages < 1000",
  },
  {
    name: "Invalid delayBetweenPages (Too High)",
    url: `${BASE_URL}/x-data/elonmusk?delayBetweenPages=100000`,
    expectedStatus: 400,
    description: "Should reject delayBetweenPages > 30000",
  },
  {
    name: "Non-existent User",
    url: `${BASE_URL}/x-data/thisuserdoesnotexist123456789`,
    expectedStatus: 404,
    description: "Should return 404 for non-existent users",
  },
  {
    name: "Valid Request",
    url: `${BASE_URL}/x-data/elonmusk?postsLimit=10`,
    expectedStatus: 200,
    description: "Should succeed for valid request",
  },
];

console.log("🧪 Testing Error Handling\n");

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const spinner = ora(`Testing: ${testCase.name}`).start();
  try {
    const startTime = Date.now();
    const response = await fetch(testCase.url);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const success = response.status === testCase.expectedStatus;

    if (success) {
      passed++;
      spinner.succeed(
        `PASS: ${testCase.name} (${response.status} ${response.statusText}) - ${duration}s`,
      );
    } else {
      failed++;
      spinner.fail(
        `FAIL: ${testCase.name} (Expected: ${testCase.expectedStatus}, Got: ${response.status}) - ${duration}s`,
      );
    }

    if (!response.ok) {
      try {
        const errorData = (await response.json()) as { error?: string };
        // console.log(`   Error: ${errorData.error || "Unknown error"}`);
      } catch {
        // console.log(`   Error: Unable to parse error response`);
      }
    } else if (testCase.expectedStatus === 200) {
      const data = (await response.json()) as {
        metadata?: { collected: number };
      };
      // console.log(`   Tweets Collected: ${data.metadata?.collected || 0}`);
    }
  } catch (error) {
    failed++;
    spinner.fail(
      `FAIL: ${testCase.name} - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

console.log(`\n📊 Test Results:`);
console.log(`   Total: ${testCases.length}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(
  `   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`,
);

if (failed === 0) {
  console.log(`\n✅ All error handling tests passed!`);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`);
  process.exit(1);
}
