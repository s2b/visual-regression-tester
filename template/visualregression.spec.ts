import { type Page, test, expect } from '@playwright/test';
import { VisualRegressionPage } from '@praetorius/visual-regression-tester/page';
import { getReportFromEnv, testsToRun } from '@praetorius/visual-regression-tester/utils';

const report = getReportFromEnv();
const tests = testsToRun(report.tests, report.config);

tests.forEach(({ referenceUrl, subjectUrl }) => {
  test(referenceUrl, { annotation: { type: 'subjectUrl', description: subjectUrl } }, async ({ page }) => {
    // Project-specific test preparation
    // (e. g. hide cookie banner and other sticky elements)
    // ----------------------------------------------------
    async function preparePageForScreenshot(page: Page) {

    }
    // ----------------------------------------------------

    // Take screenshots from reference and subject page and compare them
    const extraWait = report.config.increaseWaitForRetry ? test.info().retry * 1000 : 0;
    const visualRegressionPage = new VisualRegressionPage(page, referenceUrl, subjectUrl, name => test.info().outputPath(name));
    await test.step('Take screenshot from reference page', () => visualRegressionPage.takeReferenceScreenshot(preparePageForScreenshot, 0, report.config.cachePath));
    await test.step('Take screenshot of subject page', () => visualRegressionPage.takeSubjectScreenshot(preparePageForScreenshot, extraWait));
    const { paths, ...result } = await test.step('Compare screenshots', () => visualRegressionPage.compareScreenshots(report.config.threshold, false));

    // Collect data for failed tests
    expect.soft(result.match).toBeTruthy();
    if (!result.match) {
      await Promise.all([
        test.info().attach('odiff', { path: paths.diffPath, contentType: 'image/png' }),
        test.info().attach('reference', { path: paths.referencePath, contentType: 'image/png' }),
        test.info().attach('subject', { path: paths.subjectPath, contentType: 'image/png' }),
      ]);
      test.info().annotations.push({ type: 'odiff result', description: JSON.stringify(result)});
      if (test.info().retry > 0) {
        await test.step('Re-take screenshot from reference page after first failed retry', () => visualRegressionPage.takeReferenceScreenshot(preparePageForScreenshot, extraWait, report.config.cachePath, true));
      }
    }
    paths.cleanup();
  });
});
