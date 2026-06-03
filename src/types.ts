export interface ReportItem {
  identifier: string;
  referenceUrl: string;
  subjectUrl: string;
  sitemapUrl: string;
  status: "scheduled" | "passed" | "failed" | "skipped";
  retries?: number;
  time?: number;
  accepted?: boolean;
  screenshotReference?: string;
  screenshotSubject?: string;
  screenshotDiff?: string;
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
  increaseWaitForRetry?: boolean;
  outputPath?: string;
  cachePath?: string;
  diff?: {
    threshold?: number;
    maxPixelsDifferent?: number;
    maxPercentDifferent?: number;
  };
  run?: {
    limit?: number;
    skipAccepted?: boolean;
    skipPassed?: boolean;
  };
}

export interface FullConfig extends Config {
  sitemapUrls: string[];
  increaseWaitForRetry: boolean;
  outputPath: string;
  cachePath: string;
  diff: {
    threshold: number;
    maxPixelsDifferent: number;
    maxPercentDifferent: number;
  };
  run: {
    limit: number;
    skipAccepted: boolean;
    skipPassed: boolean;
  };
}
