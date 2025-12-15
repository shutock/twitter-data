export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ScraperError";
  }
}

export class BrowserError extends ScraperError {
  constructor(message: string, details?: unknown) {
    super(message, "BROWSER_ERROR", details);
    this.name = "BrowserError";
  }
}

export class NavigationError extends ScraperError {
  constructor(message: string, url?: string) {
    super(message, "NAVIGATION_ERROR", url ? { url } : undefined);
    this.name = "NavigationError";
  }
}

export class ParsingError extends ScraperError {
  constructor(message: string, selector?: string) {
    super(message, "PARSING_ERROR", selector ? { selector } : undefined);
    this.name = "ParsingError";
  }
}

export const handleError = (error: unknown, context: string): never => {
  if (error instanceof ScraperError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ScraperError(
      `${context}: ${error.message}`,
      "UNKNOWN_ERROR",
      error,
    );
  }

  throw new ScraperError(
    `${context}: Unknown error occurred`,
    "UNKNOWN_ERROR",
    error,
  );
};
