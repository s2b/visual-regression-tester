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
  referenceUrl: string;
  subjectUrl: string;
  sitemapUrls?: string[];
  outputPath?: string;
  cachePath?: string;
  diff?: {
    threshold?: number;
    maxPixelsDifferent?: number;
    maxPercentDifferent?: number;
  };
  run?: {
    limit?: number;
    status?: TestStatus[];
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
