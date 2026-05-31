import type { JSHandle, Page } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import sharp, { type Sharp } from 'sharp';
import odiff from 'odiff-bin';

export class VisualRegressionPage {
	readonly page: Page;
	readonly referenceUrl: string;
	readonly subjectUrl: string;
	readonly createOutputFilePath: (name: string) => string;
	reference?: Sharp;
	subject?: Sharp;

	constructor(
		page: Page,
		referenceUrl: string,
		subjectUrl: string,
		createOutputFilePath: (name: string) => string,
	) {
		this.page = page;
		this.referenceUrl = referenceUrl;
		this.subjectUrl = subjectUrl;
		this.createOutputFilePath = createOutputFilePath;
	}

	async compareScreenshots(threshold: number, cleanupOutputFiles: true): Promise<odiff.ODiffResult>;
	async compareScreenshots(threshold: number, cleanupOutputFiles: false): Promise<odiff.ODiffResult & { paths: { referencePath: string, subjectPath: string, diffPath: string, cleanup: () => void } }>;
	async compareScreenshots(threshold: number, cleanupOutputFiles = true) {
		if (!this.reference || !this.subject) {
			throw new Error('Reference and/or subject screenshot not available for comparison.');
		}
		const referencePath = this.createOutputFilePath('reference.png');
		const subjectPath = this.createOutputFilePath('subject.png');
		const diffPath = this.createOutputFilePath('diff.png');
		await Promise.all([
			this.reference.png().toFile(referencePath),
			this.subject.png().toFile(subjectPath),
		]);
		const result = await odiff.compare(
			referencePath,
			subjectPath,
			diffPath,
			{ threshold, diffOverlay: 0.5 }
		);
		const cleanup = () => {
			fs.rmSync(referencePath);
			fs.rmSync(subjectPath);
			if (fs.existsSync(diffPath)) {
				fs.rmSync(diffPath);
			}
		};
		if (cleanupOutputFiles) {
			cleanup();
			return result;
		} else {
			return {
				...result,
				paths: {
					referencePath,
					subjectPath,
					diffPath,
					cleanup,
				},
			};
		}
	}

	async takeReferenceScreenshot(runBefore?: (page: Page) => {}, extraWait = 0, cacheDir?: string, forceRetake = false) {
		if (cacheDir) {
			fs.mkdirSync(cacheDir, { recursive: true });
			const cachePath = path.join(cacheDir, this.getCacheIdentifier() + '.png');
			if (fs.existsSync(cachePath) && !forceRetake) {
				this.reference = await sharp(cachePath);
			} else {
				this.reference = await this.takeScreenshot(this.referenceUrl, runBefore, extraWait);
				await this.reference.png().toFile(cachePath);
			}
		} else {
			this.reference = await this.takeScreenshot(this.referenceUrl);
		}
		return this.reference;
	}

	async takeSubjectScreenshot(runBefore?: (page: Page) => {}, extraWait = 0) {
		this.subject = await this.takeScreenshot(this.subjectUrl, runBefore, extraWait);
		return this.subject;
	}

	private async takeScreenshot(url: string, runBefore?: (page: Page) => {}, extraWait = 0) {
		await this.page.goto(url);
		await this.disableAnimations();
		await this.disableLazyLoading();
		if (runBefore) {
			await runBefore(this.page);
		}
		await this.waitUntilLoaded();
		if (extraWait) {
			await this.page.waitForTimeout(extraWait);
		}
		return sharp(await this.page.screenshot({ fullPage: true }));
	}

	private async disableAnimations() {
		await this.page.addStyleTag({
			content: `
				* {
					animation: none !important;
					transition: none !important;
				}
			`
		});
	}

	private async disableLazyLoading() {
		type LoadingElement = HTMLElement & { loading: 'eager' | 'lazy' };
		const document: JSHandle<Document> = await this.page.evaluateHandle('document');
		await this.page.evaluate(
			document => document.querySelectorAll<LoadingElement>('[loading=lazy]').forEach(elem => elem.loading = 'eager'),
			document
		);
	}

	private async waitUntilLoaded() {
		await this.page.waitForLoadState('networkidle');
	}

	private getCacheIdentifier() {
		// Uses the same algorithm to calcuate file name as playwright itself
		return this.sanitizeForFilePath(this.trimLongString(this.referenceUrl));
	}

	private sanitizeForFilePath(s: string) {
		return s.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, '-');
	}

	private trimLongString(s: string, length = 100) {
		if (s.length <= length)
			return s;
		const hash = this.calculateSha1(s);
		const middle = `-${hash.substring(0, 5)}-`;
		const start = Math.floor((length - middle.length) / 2);
		const end = length - middle.length - start;
		return s.substring(0, start) + middle + s.slice(-end);
	}

	private calculateSha1(s: string) {
		return crypto.createHash('sha1').update(s).digest('hex');
	}
}
