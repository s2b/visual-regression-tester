import type { FullConfig, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { ODiffResult } from 'odiff-bin';
import { Report } from './Report.js';
import { getReportFromEnv, resolveReportFile, writeReportToFile } from './Utils.js';

export default class VisualRegressionReporter implements Reporter {
	private reportFile = '';
	private report?: Report;

	onBegin(config: FullConfig) {
		this.reportFile = resolveReportFile(config.configFile);
		this.report = getReportFromEnv();
	}

	onTestEnd(test: TestCase, result: TestResult) {
		const reportItem = this.report?.tests?.find(item => item.referenceUrl === test.title);
		if (!reportItem) {
			return;
		}
		if (reportItem.status !== 'scheduled' && reportItem.status !== result.status) {
			reportItem.status = 'flaky';
		} else {
			reportItem.status = result.status === 'passed' || result.status === 'skipped' ? result.status : 'failed';
		}
		reportItem.time = result.duration;
		reportItem.retries = result.retry;
		reportItem.accepted ??= !result.error;
		reportItem.screenshotReference = result.attachments.find(attachment => attachment.name === 'reference')?.path;
		reportItem.screenshotSubject = result.attachments.find(attachment => attachment.name === 'subject')?.path;
		reportItem.screenshotDiff = result.attachments.find(attachment => attachment.name === 'odiff')?.path;
		const odiffResult: ODiffResult = JSON.parse(result.annotations.find(annotation => annotation.type === 'odiff result')?.description ?? '{}');
		if (!odiffResult.match && odiffResult.reason === 'pixel-diff') {
			reportItem.diffScore = odiffResult.diffCount;
		}
	}

	onEnd() {
		if (this.report?.tests?.length && this.reportFile) {
			writeReportToFile(this.reportFile, this.report);
		}
	}

	printsToStdio() {
		return false;
	}
}
