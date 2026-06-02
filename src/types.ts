export interface ReportItem {
  identifier: string;
  referenceUrl: string;
  subjectUrl: string;
  sitemapUrl: string;
  status: "scheduled" | "passed" | "failed" | "skipped";
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
  };
}
