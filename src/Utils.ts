import path from 'node:path';
import fs from 'node:fs';
import type { FullReport, FullReportConfig, Report, ReportItem } from './Report.js';

const reportFileName = 'visualRegressionReport.json';
const envName = 'VISUAL_REGRESSION_REPORT'

export function resolveReportFile(playwrightConfigFile?: string) {
	const outputPath = playwrightConfigFile ? path.dirname(playwrightConfigFile) : process.cwd();
	return path.join(outputPath, reportFileName);
}

export function getReportFromEnv() {
	return JSON.parse(process.env[envName] ?? '{}') as FullReport;
}

export function getReportFromFile(file: string, createExampleFileIfMissing = false) {
	if (!fs.existsSync(file)) {
		if (createExampleFileIfMissing) {
			storeReportInEnv({
				config: {
					referenceUrl: 'https://www.example.com',
					subjectUrl: 'https://example.ddev.site',
				},
			});
			throw new Error(`Visual regression report file does not exist. An example has been created in ${reportFileName}.`);
		} else {
			throw new Error('Visual regression report file does not exist.');
		}
	}
	const rawReport = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }));
	if (!rawReport.config || !rawReport.config.referenceUrl || !rawReport.config.subjectUrl) {
		throw new Error('Visual regression report file must at least specify config.referenceUrl and config.subjectUrl.');
	}
	rawReport.config.referenceUrl = rawReport.config.referenceUrl.replace(/\/$/, '');
	rawReport.config.subjectUrl = rawReport.config.subjectUrl.replace(/\/$/, '');
	rawReport.config.sitemapUrl ??= rawReport.config.referenceUrl + '/sitemap.xml';
	rawReport.config.threshold ??= 0.2;
	rawReport.config.increaseWaitForRetry ??= true;
	rawReport.config.cachePath ??= path.join(path.dirname(file), 'reference-screenshots');
	rawReport.config.run ??= {};
	rawReport.config.run.limit ??= -1;
	rawReport.config.run.skipAccepted ??= false;
	rawReport.config.run.skipPassed ??= false;
	rawReport.config.run.skipFlaky ??= false;
	rawReport.tests ??= [];
	return rawReport as FullReport;
}

export function storeReportInEnv(report: Report) {
	process.env[envName] = JSON.stringify(report);
}

export function writeReportToFile(file: string, report: Report) {
	fs.writeFileSync(file, JSON.stringify(report, undefined, 2));
}

export function testsToRun(tests: ReportItem[], config: FullReportConfig) {
	tests = tests.filter(test => {
		if (config.run.skipAccepted && test.accepted) {
			return false;
		}
		if (config.run.skipFlaky && test.status === 'flaky') {
			return false;
		}
		if (config.run.skipPassed && test.status === 'passed') {
			return false;
		}
		return true;
	});
	return config.run.limit < 0 ? tests : tests.slice(0, config.run.limit);
}
