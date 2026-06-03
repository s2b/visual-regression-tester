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

  if (!report.tests.length) {
    console.log("Crawling sitemaps...");
    const sitemapper = new Sitemapper();
    const sitemaps = await Promise.all(
      config.sitemapUrls.map((sitemapUrl) => sitemapper.fetch(sitemapUrl)),
    );
    const testsAdded = new Set();
    sitemaps.forEach((sitemap) => {
      console.log(`  ${sitemap.url} (${sitemap.sites.length} urls)`);
      sitemap.sites.forEach((url) => {
        const identifier = calculateIdentifier(url);
        if (testsAdded.has(identifier)) {
          return;
        }
        testsAdded.add(identifier);
        report.tests.push({
          identifier,
          referenceUrl: url,
          subjectUrl: url.replace(config.referenceUrl, config.subjectUrl),
          sitemapUrl: sitemap.url,
          status: "scheduled",
        });
      });
    });
  }

  setReport(report);
};
