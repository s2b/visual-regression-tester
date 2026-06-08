import { type Page, test, expect } from '@playwright/test';
import { VisualRegressionPage } from '@praetorius/visual-regression-tester/page';
import { getConfig, getReport, testsToRun } from '@praetorius/visual-regression-tester';

const config = getConfig();
const tests = testsToRun(getReport().tests);

tests.forEach(({ identifier, referenceUrl, subjectUrl, updateScreenshotReference }) => {
	test(referenceUrl, { annotation: { type: 'subjectUrl', description: subjectUrl } }, async ({ page }) => {
		// Project-specific test preparation
		// (e. g. hide cookie banner and other sticky elements)
		// ----------------------------------------------------
		async function preparePageForScreenshot(page: Page) {

		}
		// ----------------------------------------------------

		// Take screenshots from reference and subject page and compare them
		const visualRegressionPage = new VisualRegressionPage(page, referenceUrl, subjectUrl, name => test.info().outputPath(name));
		await test.step('Take screenshot from reference page', () => visualRegressionPage.takeReferenceScreenshot(preparePageForScreenshot, config.cachePath, identifier, updateScreenshotReference));
		await test.step('Take screenshot of subject page', () => visualRegressionPage.takeSubjectScreenshot(preparePageForScreenshot));
		const { paths, ...result } = await test.step('Compare screenshots', () => visualRegressionPage.compareScreenshots(config.diff, false));

		// Collect data for failed tests
		expect.soft(result.match).toBeTruthy();
		if (!result.match) {
			await Promise.all([
				test.info().attach('odiff', { path: paths.diffPath, contentType: 'image/png' }),
				test.info().attach('reference', { path: paths.referencePath, contentType: 'image/png' }),
				test.info().attach('subject', { path: paths.subjectPath, contentType: 'image/png' }),
				test.info().attach('minimap', { path: paths.minimapPath, contentType: 'image/png' }),
			]);
			test.info().annotations.push({ type: 'odiff result', description: JSON.stringify(result)});
		}
		paths.cleanup();
	});
});
