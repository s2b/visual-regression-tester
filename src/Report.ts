export interface ReportItem {
  referenceUrl: string;
  subjectUrl: string;
  status: "scheduled" | "passed" | "failed" | "flaky" | "skipped";
  retries?: number;
  accepted?: boolean;
  screenshotReference?: string;
  screenshotSubject?: string;
  screenshotDiff?: string;
  diffScore?: number;
  time?: number;
}

export interface ReportConfig {
  referenceUrl: string;
  subjectUrl: string;
  sitemapUrl?: string;
  threshold?: number;
  increaseWaitForRetry?: boolean;
  cachePath?: string;
  run?: {
    limit?: number;
    skipAccepted?: boolean;
    skipPassed?: boolean;
    skipFlaky?: boolean;
  };
}

export interface Report {
  config: ReportConfig;
  tests?: ReportItem[];
}

export interface FullReportConfig extends ReportConfig {
  sitemapUrl: string;
  threshold: number;
  increaseWaitForRetry: boolean;
  cachePath: string;
  run: {
    limit: number;
    skipAccepted: boolean;
    skipPassed: boolean;
    skipFlaky: boolean;
  };
}

export interface FullReport extends Report {
  config: FullReportConfig;
  tests: ReportItem[];
}
