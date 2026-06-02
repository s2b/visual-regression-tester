import Sitemapper from "sitemapper";
import { FullConfig } from "@playwright/test";
import { getConfig, getReport, initialize, setReport } from "./index.js";

export default async (playwrightConfig: FullConfig) => {
  await initialize(playwrightConfig);
  const config = getConfig();
  const report = getReport();

  if (!report.tests.length) {
    console.log("crawling sitemaps...");
    // TODO crawl robots.txt
    const sitemap = new Sitemapper();
    const pages = await sitemap.fetch(config.sitemapUrl);
    report.tests = pages.sites.map((site) => ({
      referenceUrl: site,
      subjectUrl: site.replace(config.referenceUrl, config.subjectUrl),
      sitemapUrl: config.sitemapUrl,
      status: "scheduled",
    }));
  }

  setReport(report);
};
