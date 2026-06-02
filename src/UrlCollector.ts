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
    console.log("crawling sitemaps...");
    // TODO crawl robots.txt
    const sitemapper = new Sitemapper();
    const sitemaps = await Promise.all(
      config.sitemapUrls.map((sitemapUrl) => sitemapper.fetch(sitemapUrl)),
    );
    sitemaps.forEach((sitemap) => {
      sitemap.sites.forEach((url) => {
        report.tests.push({
          identifier: calculateIdentifier(url),
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
