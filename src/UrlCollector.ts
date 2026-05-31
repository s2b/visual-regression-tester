import Sitemapper from 'sitemapper';
import { FullConfig } from '@playwright/test';
import { resolveReportFile, getReportFromFile, storeReportInEnv } from './Utils.js';

export default async (config: FullConfig) => {
	const report = getReportFromFile(resolveReportFile(config.configFile), true);

	if (!report.tests.length) {
		console.log('crawling sitemap.xml...');
		// TODO crawl robots.txt
		const sitemap = new Sitemapper();
		const pages = await sitemap.fetch(report.config.sitemapUrl);
		report.tests = pages.sites.map(site => ({
			referenceUrl: site,
			subjectUrl: site.replace(report.config.referenceUrl, report.config.subjectUrl),
			status: 'scheduled',
		}));
	}

	storeReportInEnv(report);
};
