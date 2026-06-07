import type { JSHandle, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import odiff from "odiff-bin";
import { FullConfig } from "./types.js";

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

  async compareScreenshots(
    diffConfig: FullConfig["diff"],
    cleanupOutputFiles: true,
  ): Promise<odiff.ODiffResult>;
  async compareScreenshots(
    diffConfig: FullConfig["diff"],
    cleanupOutputFiles: false,
  ): Promise<
    odiff.ODiffResult & {
      paths: {
        referencePath: string;
        subjectPath: string;
        diffPath: string;
        minimapPath: string;
        cleanup: () => void;
      };
    }
  >;
  async compareScreenshots(
    diffConfig: FullConfig["diff"],
    cleanupOutputFiles = true,
  ) {
    if (!this.reference || !this.subject) {
      throw new Error(
        "Reference and/or subject screenshot not available for comparison.",
      );
    }
    const referencePath = this.createOutputFilePath("reference.png");
    const subjectPath = this.createOutputFilePath("subject.png");
    const diffPath = this.createOutputFilePath("diff.png");
    const minimapPath = this.createOutputFilePath("minimap.png");
    await Promise.all([
      this.reference.png().toFile(referencePath),
      this.subject.png().toFile(subjectPath),
    ]);
    let result = await odiff.compare(referencePath, subjectPath, diffPath, {
      threshold: diffConfig.threshold,
      diffOverlay: 0.5,
      captureDiffLines: true,
    });
    if (
      !result.match &&
      result.reason == "pixel-diff" &&
      (result.diffCount < diffConfig.maxPixelsDifferent ||
        result.diffPercentage < diffConfig.maxPercentDifferent)
    ) {
      result = { match: true };
    }
    if (!result.match && result.reason == "pixel-diff" && result.diffLines) {
      const channels = 4;
      const height = (await this.reference.metadata()).height;
      const data = Buffer.alloc(height * channels, 0);
      result.diffLines.forEach((y) => {
        const offset = y * channels;
        data[offset] = 255;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 255;
      });
      await sharp(data, {
        raw: {
          width: 1,
          height,
          channels,
        },
      })
        .png()
        .toFile(minimapPath);
    }
    const cleanup = () => {
      fs.rmSync(referencePath);
      fs.rmSync(subjectPath);
      if (fs.existsSync(diffPath)) {
        fs.rmSync(diffPath);
      }
      if (fs.existsSync(minimapPath)) {
        fs.rmSync(minimapPath);
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
          minimapPath,
          cleanup,
        },
      };
    }
  }

  async takeReferenceScreenshot(
    runBefore?: (page: Page) => {},
    extraWait = 0,
    cacheDir?: string,
    cacheIdentifier?: string,
    forceRetake = false,
  ) {
    if (cacheDir && cacheIdentifier) {
      fs.mkdirSync(cacheDir, { recursive: true });
      const cachePath = path.join(cacheDir, cacheIdentifier + ".png");
      if (fs.existsSync(cachePath) && !forceRetake) {
        this.reference = await sharp(cachePath);
      } else {
        this.reference = await this.takeScreenshot(
          this.referenceUrl,
          runBefore,
          extraWait,
        );
        await this.reference.png().toFile(cachePath);
      }
    } else {
      this.reference = await this.takeScreenshot(this.referenceUrl);
    }
    return this.reference;
  }

  async takeSubjectScreenshot(runBefore?: (page: Page) => {}, extraWait = 0) {
    this.subject = await this.takeScreenshot(
      this.subjectUrl,
      runBefore,
      extraWait,
    );
    return this.subject;
  }

  private async takeScreenshot(
    url: string,
    runBefore?: (page: Page) => {},
    extraWait = 0,
  ) {
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
				*, *::before, *::after {
					animation: none !important;
					transition: none !important;
				}
			`,
    });
  }

  private async disableLazyLoading() {
    type LoadingElement = HTMLElement & { loading: "eager" | "lazy" };
    const document: JSHandle<Document> =
      await this.page.evaluateHandle("document");
    await this.page.evaluate(
      (document) =>
        document
          .querySelectorAll<LoadingElement>("[loading=lazy]")
          .forEach((elem) => (elem.loading = "eager")),
      document,
    );
  }

  private async waitUntilLoaded() {
    await this.page.waitForLoadState("networkidle");
  }
}
