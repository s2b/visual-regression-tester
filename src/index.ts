import { FullConfig as PlaywrightConfig } from "@playwright/test";
import type { Report, ReportItem, Config, FullConfig } from "./types.js";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const configFileName = "visualRegression.config.js";
const reportFileName = "visualRegressionReport.json";
const configEnvName = "VISUAL_REGRESSION_CONFIG";
const reportEnvName = "VISUAL_REGRESSION_REPORT";

export async function initialize(playwrightConfig: PlaywrightConfig) {
  const rootPath = playwrightConfig.configFile
    ? path.dirname(playwrightConfig.configFile)
    : process.cwd();
  const config = await getConfigFromFile(rootPath);
  storeConfigInEnv(config);
}

export function defineConfig(config: Config): FullConfig {
  if (!config.referenceUrl || !config.subjectUrl) {
    throw new Error(
      'Visual regression config file must at least specify "referenceUrl" and "subjectUrl".',
    );
  }
  config.referenceUrl = stripTrailingSlash(config.referenceUrl);
  config.subjectUrl = stripTrailingSlash(config.subjectUrl);
  return {
    sitemapUrls: [config.referenceUrl + "/sitemap.xml"],
    increaseWaitForRetry: true,
    cachePath: "{rootPath}/reference-screenshots/",
    outputPath: "{rootPath}/visual-regression-report/",
    ...config,
    diff: {
      threshold: 0.2,
      maxPixelsDifferent: 10,
      maxPercentDifferent: 0,
      ...config.diff,
    },
    run: {
      limit: -1,
      skipAccepted: false,
      skipPassed: false,
      ...config.run,
    },
  };
}

export function getConfig() {
  return getConfigFromEnv();
}

export function getReport() {
  return getReportFromEnv() ?? getReportFromFile();
}

export function setReport(report: Report) {
  storeReportInEnv(report);
}

export function writeReport() {
  writeReportToFile(getReport());
}

export function testsToRun(tests: ReportItem[]) {
  const config = getConfigFromEnv();
  tests = tests.filter((test) => {
    if (config.run.skipAccepted && test.accepted) {
      return false;
    }
    if (config.run.skipPassed && test.status === "passed") {
      return false;
    }
    return true;
  });
  return config.run.limit < 0 ? tests : tests.slice(0, config.run.limit);
}

export function calculateIdentifier(url: string) {
  // Uses the same algorithm to calcuate file name as playwright itself
  return sanitizeForFilePath(trimLongString(url));
}

function getConfigFromEnv() {
  if (!process.env[configEnvName]) {
    throw new Error("Visual regression config was not properly initialized.");
  }
  return JSON.parse(process.env[configEnvName]) as FullConfig;
}

function getReportFromEnv() {
  return process.env[reportEnvName]
    ? (JSON.parse(process.env[reportEnvName]) as Report)
    : null;
}

function storeConfigInEnv(config: FullConfig) {
  process.env[configEnvName] = JSON.stringify(config);
}

function storeReportInEnv(report: Report) {
  process.env[reportEnvName] = JSON.stringify(report);
}

async function getConfigFromFile(rootPath: string): Promise<FullConfig> {
  rootPath = stripTrailingSlash(rootPath);
  const configFile = path.join(rootPath, configFileName);
  if (!fs.existsSync(configFile)) {
    throw new Error(
      `Visual regression config file does not exist in "${configFile}".`,
    );
  }
  const config: FullConfig = (await import(configFile)).default;
  for (const property of ["cachePath", "outputPath"] as const) {
    config[property] = config[property].replaceAll("{rootPath}", rootPath);
  }
  return config;
}

function getReportFromFile(): Report {
  const config = getConfigFromEnv();
  const reportFile = path.join(config.outputPath, reportFileName);
  const defaultReport: Report = {
    referenceUrl: config.referenceUrl,
    subjectUrl: config.subjectUrl,
    tests: [],
  };
  if (!fs.existsSync(reportFile)) {
    return defaultReport;
  }
  const report = JSON.parse(fs.readFileSync(reportFile, { encoding: "utf-8" }));
  return { ...defaultReport, ...report };
}

function writeReportToFile(report: Report) {
  const config = getConfigFromEnv();
  const reportFile = path.join(config.outputPath, reportFileName);
  fs.mkdirSync(config.outputPath, { recursive: true });
  report = copyScreenshotFiles(report, config.outputPath);
  fs.writeFileSync(reportFile, JSON.stringify(report, undefined, 2));
}

function copyScreenshotFiles(report: Report, outputPath: string) {
  report.tests = report.tests.map((test) => {
    if (!test.identifier) {
      throw new Error(
        `Test "${test.referenceUrl}" does not have an identifier.`,
      );
    }
    test.identifier = path.basename(test.identifier);
    const testOutputPath = path.join(outputPath, test.identifier);
    if (
      !test.screenshotDiff ||
      !test.screenshotReference ||
      !test.screenshotSubject
    ) {
      if (test.status === "passed") {
        if (fs.existsSync(testOutputPath)) {
          fs.rmSync(testOutputPath, { recursive: true });
        }
      }
      return test;
    }
    if (
      test.screenshotDiff.startsWith(test.identifier) ||
      test.screenshotReference.startsWith(test.identifier) ||
      test.screenshotSubject.startsWith(test.identifier)
    ) {
      return test;
    }
    if (fs.existsSync(testOutputPath)) {
      fs.rmSync(testOutputPath, { recursive: true });
    }
    fs.mkdirSync(testOutputPath);
    for (const property of [
      "screenshotDiff",
      "screenshotReference",
      "screenshotSubject",
    ] as const) {
      if (test[property]) {
        const oldPath = test[property];
        test[property] = path.join(
          test.identifier,
          path.basename(test[property]),
        );
        fs.copyFileSync(oldPath, path.join(outputPath, test[property]));
      }
    }
    return test;
  });
  return report;
}

function stripTrailingSlash(str: string) {
  return str.endsWith("/") ? str.slice(0, -1) : str;
}

function sanitizeForFilePath(s: string) {
  return s.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, "-");
}

function trimLongString(s: string, length = 100) {
  if (s.length <= length) return s;
  const hash = calculateSha1(s);
  const middle = `-${hash.substring(0, 5)}-`;
  const start = Math.floor((length - middle.length) / 2);
  const end = length - middle.length - start;
  return s.substring(0, start) + middle + s.slice(-end);
}

function calculateSha1(s: string) {
  return crypto.createHash("sha1").update(s).digest("hex");
}
