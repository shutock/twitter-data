import { describe, expect, mock, test } from "bun:test";

import { getPageInfo, shouldStopPagination } from "./pagination";

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
        { ...pageInfo, linkText: "" },
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
        { ...pageInfo, linkText: "" },
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
        { ...pageInfo, linkText: "Profile" },
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
        { ...pageInfo, linkText: "Load more" },
        "testuser",
        undefined,
        50,
        100,
      );

      expect(result).toBe(false);
    });

    test("should update ora text when provided", () => {
      const mockOra = { text: "" };

      const pageInfo = {
        hasShowMore: false,
        hasLink: false,
        linkHref: null,
        itemCount: 10,
      };

      shouldStopPagination(
        { ...pageInfo, linkText: "" },
        "testuser",
        mockOra as any,
        50,
        100,
      );

      expect(mockOra.text).toContain("no-show-more-div");
    });
  });
});
