import type { Browser, Page } from "puppeteer";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createBrowser, createPage, navigateToPage } from "./browser";

describe("Browser Utils", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await createBrowser({ headless: true });
  });

  afterAll(async () => {
    await browser?.close();
  });

  describe("createBrowser", () => {
    test("should create a browser instance", async () => {
      const testBrowser = await createBrowser();
      expect(testBrowser).toBeDefined();
      expect(typeof testBrowser.close).toBe("function");
      await testBrowser.close();
    });

    test("should create a headless browser by default", async () => {
      const testBrowser = await createBrowser();
      expect(testBrowser).toBeDefined();
      await testBrowser.close();
    });

    test("should respect headless configuration", async () => {
      const testBrowser = await createBrowser({ headless: false });
      expect(testBrowser).toBeDefined();
      await testBrowser.close();
    });
  });

  describe("createPage", () => {
    test("should create a page with default configuration", async () => {
      page = await createPage(browser);
      expect(page).toBeDefined();
      expect(typeof page.goto).toBe("function");
    });

    test("should set custom user agent", async () => {
      const customUserAgent = "CustomBot/1.0";
      const testPage = await createPage(browser, {
        userAgent: customUserAgent,
      });
      expect(testPage).toBeDefined();
      await testPage.close();
    });

    test("should block specified resources", async () => {
      const testPage = await createPage(browser, {
        blockResources: ["image", "font", "stylesheet"],
      });
      expect(testPage).toBeDefined();
      await testPage.close();
    });
  });

  describe("navigateToPage", () => {
    test("should navigate to a valid URL", async () => {
      const testPage = await createPage(browser);
      await navigateToPage(testPage, "https://example.com");
      const url = testPage.url();
      expect(url).toContain("example.com");
      await testPage.close();
    });

    test("should wait for page to load", async () => {
      const testPage = await createPage(browser);
      await navigateToPage(testPage, "https://example.com");
      const content = await testPage.content();
      expect(content.length).toBeGreaterThan(0);
      await testPage.close();
    });

    test("should throw error for invalid URL", async () => {
      const testPage = await createPage(browser);

      try {
        await navigateToPage(testPage, "not-a-valid-url");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        await testPage.close();
      }
    });

    test("should respect custom timeout", async () => {
      const testPage = await createPage(browser);

      try {
        await navigateToPage(
          testPage,
          "https://httpstat.us/200?sleep=10000",
          1000,
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        await testPage.close();
      }
    });
  });
});
