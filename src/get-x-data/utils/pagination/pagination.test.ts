import { describe, expect, mock, test } from "bun:test";

import {
  applyRateLimitDelay,
  getPageInfo,
  shouldStopPagination,
} from "./pagination";

describe("Pagination Utils", () => {
  describe("getPageInfo", () => {
    test("should extract page information from page with show-more", async () => {
      const mockPage = {
        evaluate: mock(async () => ({
          hasShowMore: true,
          hasLink: true,
          linkHref: "/user?cursor=abc123",
          itemCount: 20,
        })),
      };

      const result = await getPageInfo(mockPage as any);

      expect(result.hasShowMore).toBe(true);
      expect(result.hasLink).toBe(true);
      expect(result.linkHref).toBe("/user?cursor=abc123");
      expect(result.itemCount).toBe(20);
    });

    test("should handle page without show-more", async () => {
      const mockPage = {
        evaluate: mock(async () => ({
          hasShowMore: false,
          hasLink: false,
          linkHref: null,
          itemCount: 5,
        })),
      };

      const result = await getPageInfo(mockPage as any);

      expect(result.hasShowMore).toBe(false);
      expect(result.hasLink).toBe(false);
      expect(result.linkHref).toBeNull();
    });

    test("should count timeline items correctly", async () => {
      const mockPage = {
        evaluate: mock(async () => ({
          hasShowMore: true,
          hasLink: true,
          linkHref: "/user?cursor=xyz",
          itemCount: 42,
        })),
      };

      const result = await getPageInfo(mockPage as any);

      expect(result.itemCount).toBe(42);
    });
  });

  describe("shouldStopPagination", () => {
    test("should stop when no show-more element", () => {
      const pageInfo = {
        hasShowMore: false,
        hasLink: false,
        linkHref: null,
        itemCount: 10,
      };

      const result = shouldStopPagination(
        pageInfo,
        "testuser",
        undefined,
        50,
        100,
      );

      expect(result).toBe(true);
    });

    test("should stop when no link in show-more", () => {
      const pageInfo = {
        hasShowMore: true,
        hasLink: false,
        linkHref: null,
        itemCount: 10,
      };

      const result = shouldStopPagination(
        pageInfo,
        "testuser",
        undefined,
        50,
        100,
      );

      expect(result).toBe(true);
    });

    test("should stop when link points to user profile", () => {
      const pageInfo = {
        hasShowMore: true,
        hasLink: true,
        linkHref: "/testuser",
        itemCount: 10,
      };

      const result = shouldStopPagination(
        pageInfo,
        "testuser",
        undefined,
        50,
        100,
      );

      expect(result).toBe(true);
    });

    test("should continue when valid cursor link exists", () => {
      const pageInfo = {
        hasShowMore: true,
        hasLink: true,
        linkHref: "/testuser?cursor=abc123",
        itemCount: 20,
      };

      const result = shouldStopPagination(
        pageInfo,
        "testuser",
        undefined,
        50,
        100,
      );

      expect(result).toBe(false);
    });

    test("should update ora text when provided", () => {
      const mockOra = {
        text: "",
      };

      const pageInfo = {
        hasShowMore: false,
        hasLink: false,
        linkHref: null,
        itemCount: 10,
      };

      shouldStopPagination(pageInfo, "testuser", mockOra as any, 50, 100);

      expect(mockOra.text).toContain("no-show-more-div");
    });
  });

  describe("applyRateLimitDelay", () => {
    test("should apply delay within expected range", async () => {
      const delayBetweenPages = 1000;
      const startTime = Date.now();

      await applyRateLimitDelay(delayBetweenPages);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(delayBetweenPages * 0.8 - 50);
      expect(elapsed).toBeLessThanOrEqual(delayBetweenPages * 1.5 + 50);
    });

    test("should update ora text when provided", async () => {
      const mockOra = {
        text: "",
      };

      await applyRateLimitDelay(1000, mockOra as any, 50, 100);

      expect(mockOra.text).toContain("Rate limit delay");
      expect(mockOra.text).toContain("50/100");
    });

    test("should work without ora", async () => {
      await expect(applyRateLimitDelay(100)).resolves.toBeUndefined();
    });

    test("should apply different delays for different values", async () => {
      const delay1 = 500;
      const delay2 = 2000;

      const start1 = Date.now();
      await applyRateLimitDelay(delay1);
      const elapsed1 = Date.now() - start1;

      const start2 = Date.now();
      await applyRateLimitDelay(delay2);
      const elapsed2 = Date.now() - start2;

      expect(elapsed2).toBeGreaterThan(elapsed1);
    });

    test("should handle zero delay", async () => {
      const startTime = Date.now();
      await applyRateLimitDelay(0);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
