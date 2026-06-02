export interface ReportItem {
  referenceUrl: string;
  subjectUrl: string;
  sitemapUrl: string;
  status: "scheduled" | "passed" | "failed" | "flaky" | "skipped";
  retries?: number;
  accepted?: boolean;
  screenshotReference?: string;
  screenshotSubject?: string;
  screenshotDiff?: string;
  diffScore?: number;
  time?: number;
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
  threshold?: number;
  increaseWaitForRetry?: boolean;
  outputPath?: string;
  cachePath?: string;
  run?: {
    limit?: number;
    skipAccepted?: boolean;
    skipPassed?: boolean;
    skipFlaky?: boolean;
  };
}

export interface FullConfig extends Config {
  sitemapUrls: string[];
  threshold: number;
  increaseWaitForRetry: boolean;
  outputPath: string;
  cachePath: string;
  run: {
    limit: number;
    skipAccepted: boolean;
    skipPassed: boolean;
    skipFlaky: boolean;
  };
}
