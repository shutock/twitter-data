import { describe, expect, test } from "bun:test";

import {
  BrowserError,
  handleError,
  NavigationError,
  ParsingError,
  ScraperError,
} from "./error";

describe("Error Utils", () => {
  describe("ScraperError", () => {
    test("should create error with message and code", () => {
      const error = new ScraperError("Test error", "TEST_ERROR");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.name).toBe("ScraperError");
    });

    test("should include details when provided", () => {
      const details = { url: "https://example.com", status: 404 };
      const error = new ScraperError("Not found", "NOT_FOUND", details);

      expect(error.details).toEqual(details);
    });

    test("should be instance of Error", () => {
      const error = new ScraperError("Test", "TEST");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ScraperError).toBe(true);
    });
  });

  describe("BrowserError", () => {
    test("should create browser error", () => {
      const error = new BrowserError("Browser failed");

      expect(error.message).toBe("Browser failed");
      expect(error.code).toBe("BROWSER_ERROR");
      expect(error.name).toBe("BrowserError");
    });

    test("should include cause when provided", () => {
      const cause = new Error("Original error");
      const error = new BrowserError("Browser failed", cause);

      expect(error.details).toBe(cause);
    });

    test("should be instance of ScraperError", () => {
      const error = new BrowserError("Test");

      expect(error instanceof ScraperError).toBe(true);
      expect(error instanceof BrowserError).toBe(true);
    });
  });

  describe("NavigationError", () => {
    test("should create navigation error", () => {
      const error = new NavigationError("Navigation failed");

      expect(error.message).toBe("Navigation failed");
      expect(error.code).toBe("NAVIGATION_ERROR");
      expect(error.name).toBe("NavigationError");
    });

    test("should include URL in details", () => {
      const error = new NavigationError(
        "Failed to navigate",
        "https://example.com",
      );

      expect(error.details).toEqual({ url: "https://example.com" });
    });

    test("should be instance of ScraperError", () => {
      const error = new NavigationError("Test");

      expect(error instanceof ScraperError).toBe(true);
      expect(error instanceof NavigationError).toBe(true);
    });
  });

  describe("ParsingError", () => {
    test("should create parsing error", () => {
      const error = new ParsingError("Parsing failed");

      expect(error.message).toBe("Parsing failed");
      expect(error.code).toBe("PARSING_ERROR");
      expect(error.name).toBe("ParsingError");
    });

    test("should include selector in details", () => {
      const error = new ParsingError("Element not found", ".test-selector");

      expect(error.details).toEqual({ selector: ".test-selector" });
    });

    test("should be instance of ScraperError", () => {
      const error = new ParsingError("Test");

      expect(error instanceof ScraperError).toBe(true);
      expect(error instanceof ParsingError).toBe(true);
    });
  });

  describe("handleError", () => {
    test("should throw ScraperError for generic Error", () => {
      const error = new Error("Test error");
      const context = "Test context";

      expect(() => handleError(error, context)).toThrow(ScraperError);
      expect(() => handleError(error, context)).toThrow(
        "Test context: Test error",
      );
    });

    test("should rethrow ScraperError", () => {
      const error = new ScraperError("Scraper failed", "SCRAPER_ERROR");

      expect(() => handleError(error, "Context")).toThrow(ScraperError);
      expect(() => handleError(error, "Context")).toThrow("Scraper failed");
    });

    test("should rethrow BrowserError", () => {
      const error = new BrowserError("Browser crashed");

      expect(() => handleError(error, "Context")).toThrow(BrowserError);
      expect(() => handleError(error, "Context")).toThrow("Browser crashed");
    });

    test("should rethrow NavigationError", () => {
      const error = new NavigationError("Nav failed", "https://example.com");

      expect(() => handleError(error, "Context")).toThrow(NavigationError);
      expect(() => handleError(error, "Context")).toThrow("Nav failed");
    });

    test("should rethrow ParsingError", () => {
      const error = new ParsingError("Parse failed", ".selector");

      expect(() => handleError(error, "Context")).toThrow(ParsingError);
      expect(() => handleError(error, "Context")).toThrow("Parse failed");
    });

    test("should wrap generic Error in ScraperError", () => {
      const error = new Error("Generic error");

      try {
        handleError(error, "Context");
      } catch (e) {
        expect(e).toBeInstanceOf(ScraperError);
        expect((e as ScraperError).message).toBe("Context: Generic error");
        expect((e as ScraperError).code).toBe("UNKNOWN_ERROR");
      }
    });

    test("should handle non-Error objects", () => {
      const error = "String error";

      expect(() => handleError(error, "Context")).toThrow(ScraperError);
      expect(() => handleError(error, "Context")).toThrow(
        "Context: Unknown error occurred",
      );
    });

    test("should handle null/undefined", () => {
      expect(() => handleError(null, "Context")).toThrow(ScraperError);
      expect(() => handleError(undefined, "Context")).toThrow(ScraperError);
    });
  });

  describe("Error inheritance chain", () => {
    test("BrowserError should inherit from ScraperError", () => {
      const error = new BrowserError("Test");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ScraperError).toBe(true);
      expect(error instanceof BrowserError).toBe(true);
    });

    test("NavigationError should inherit from ScraperError", () => {
      const error = new NavigationError("Test");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ScraperError).toBe(true);
      expect(error instanceof NavigationError).toBe(true);
    });

    test("ParsingError should inherit from ScraperError", () => {
      const error = new ParsingError("Test");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ScraperError).toBe(true);
      expect(error instanceof ParsingError).toBe(true);
    });
  });

  describe("Error serialization", () => {
    test("should serialize ScraperError to JSON", () => {
      const error = new ScraperError("Test", "CODE", { key: "value" });
      const json = JSON.stringify(error);

      expect(json).toContain("CODE");
      expect(json).toContain("ScraperError");
    });

    test("should preserve error properties", () => {
      const error = new BrowserError("Browser error", new Error("Cause"));

      expect(error.message).toBe("Browser error");
      expect(error.code).toBe("BROWSER_ERROR");
      expect(error.details).toBeInstanceOf(Error);
    });
  });
});
