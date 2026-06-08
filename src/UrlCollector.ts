import Sitemapper from "sitemapper";
import { FullConfig } from "@playwright/test";
import {
  calculateIdentifier,
  getConfig,
  getReport,
  initialize,
  setReport,
} from "./index.js";

export default async (playwrightConfig: FullConfig) => {
  await initialize(playwrightConfig);
  const config = getConfig();
  const report = getReport();

  // Schedule tests where reference screenshot should be retaken
  report.tests = report.tests.map((test) => {
    if (test.updateScreenshotReference) {
      test.status = "scheduled";
      test.accepted = false;
    }
    return test;
  });

  console.log("Crawling sitemaps...");
  const sitemapper = new Sitemapper();
  const sitemaps = await Promise.all(
    config.sitemapUrls.map((sitemapUrl) => sitemapper.fetch(sitemapUrl)),
  );
  const existingTests = new Set(report.tests.map(test => test.identifier));
  sitemaps.forEach((sitemap) => {
    let added = 0;
    sitemap.sites.forEach((url) => {
      const identifier = calculateIdentifier(url);
      if (existingTests.has(identifier)) {
        return;
      }
      existingTests.add(identifier);
      added++;
      report.tests.push({
        identifier,
        referenceUrl: url,
        subjectUrl: url.replace(config.referenceUrl, config.subjectUrl),
        sitemapUrl: sitemap.url,
        status: "scheduled",
      });
    });
    console.log(`  ${sitemap.url} (${sitemap.sites.length} urls, ${added} added)`);
  });

  setReport(report);
};
