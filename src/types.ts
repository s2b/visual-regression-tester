type TestStatus = "scheduled" | "passed" | "failed";

export interface ReportItem {
  identifier: string;
  referenceUrl: string;
  subjectUrl: string;
  sitemapUrl: string;
  status: TestStatus;
  retries?: number;
  time?: number;
  accepted?: boolean;
  updateScreenshotReference?: boolean;
  screenshotReference?: string;
  screenshotSubject?: string;
  screenshotDiff?: string;
  screenshotMinimap?: string;
  pixelsDifferent?: number;
  percentDifferent?: number;
}

export interface Report {
  referenceUrl: string;
  subjectUrl: string;
  tests: ReportItem[];
}

export interface Config {
  /**
   * Full URL to the reference site (e. g. a production website)
   * @example 'https://www.example.com'
   */
  referenceUrl: string;

  /**
   * Full URL to the site that should be compared against reference site (e. g. a development website)
   * @example 'https://dev.example.com'
   */
  subjectUrl: string;

  /**
   * One or more full URLs to xml sitemaps that should be crawled.
   * If a report already exists, only new items will be added to the report.
   * @default [referenceUrl + '/sitemap.xml']
   * @example ['https://www.example.com/sitemap.xml']
   */
  sitemapUrls?: string[];

  /**
   * Path where the visual regression report should be written to
   * @default 'visual-regression-report/'
   */
  outputPath?: string;

  /**
   * Path where the reference screenshots should be cached
   * @default 'reference-screenshots/'
   */
  cachePath?: string;

  diff?: {
    /**
     * Color difference threshold for individual pixels (from 0 to 1)
     * @default 0.2
     * @see https://github.com/dmtrKovalenko/odiff
     */
    threshold?: number;

    /**
     * Maximum individual pixels that can be different before a test fails
     * @default 10
     */
    maxPixelsDifferent?: number;

    /**
     * Maximum percentage of pixels that can be different before a test fails (from 0 to 100)
     * @default 0
     * @example 2.5
     */
    maxPercentDifferent?: number;
  };
  run?: {
    /**
     * Only run limited number of the available tests (useful for debugging purposes)
     * @default -1
     */
    limit?: number;

    /**
     * Only run tests with a certain status
     * @default ['scheduled', 'passed', 'failed']
     */
    status?: TestStatus[];

    /**
     * Skip tests that have been marked as accepted in the report
     * @default true
     */
    skipAccepted?: boolean;
  };
}

export interface FullConfig extends Config {
  sitemapUrls: string[];
  outputPath: string;
  cachePath: string;
  diff: {
    threshold: number;
    maxPixelsDifferent: number;
    maxPercentDifferent: number;
  };
  run: {
    limit: number;
    status: TestStatus[];
    skipAccepted: boolean;
  };
}
