# Visual Regression Tester

Note that this package is still work-in-progress. Use at your own risk!

## Setup

### 1. Setup node packages

```sh
mkdir visual-regression-tests
cd visual-regression-tests
npm i --save-dev @playwright/test @praetorius/visual-regression-tester
```

### 2. Configure playwright

**playwright.config.js:**

```js
// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  retries: 2,
  reporter: [
    ['dot'],
    ['@praetorius/visual-regression-tester/reporter'],
  ],
  use: {
    ignoreHTTPSErrors: true,
  },
  globalSetup: ['@praetorius/visual-regression-tester/collector'],
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

### 3. Configure visual regression tester

**visualregression.config.js:**

```js
// @ts-check
import { defineConfig } from '@praetorius/visual-regression-tester';

export default defineConfig({
  referenceUrl: "https://www.example.com",
  subjectUrl: "https://example.ddev.site",
});
```

See [Config](./src/types.ts) for all available configuration options.

### 4. Create playwright test file

A test file template is available in [visualregression.spec.ts](./template/visualregression.spec.ts).
This test should work out-of-the-box once copied into the `tests/` directory.

Depending on the features of the website you'd like to test, this file might need some adjustments,
for example:

* Closing cookie banners or hiding other fixed elements via [Locators](https://playwright.dev/docs/locators)
  or [page.evaluate()](https://playwright.dev/docs/evaluating)
* [Mocking API calls](https://playwright.dev/docs/mock)

**Example: Closing a CCM19 cookie banner**

```js
import type { JSHandle } from '@playwright/test';

async function preparePageForScreenshot(page: Page) {
  const window: JSHandle<Window & { CCM?: { closeWidget: () => {} } }> = await page.evaluateHandle('window');
  await page.evaluate(window => window.CCM && window.CCM.closeWidget(), window);
}
```

## Run tests

### Variant 1: Use local browser binaries

1. Install browser(s) with [playwright install](https://playwright.dev/docs/browsers):

```sh
npx playwright install --with-deps firefox
```

2. Run tests:

```sh
npx playwright test
```

### Variant 2: Playwright server in docker

1. Start playwright server in docker container:

```sh
docker run -p 3000:3000 --rm --init -it --workdir /home/pwuser --user pwuser mcr.microsoft.com/playwright:v1.60.0-noble /bin/sh -c "npx -y playwright@1.60.0 run-server --port 3000 --host 0.0.0.0"
```

(You might need to adjust the version numbers)

You can add the following argument to connect to the DDEV network:

```sh
--network ddev_default
```

2. Run tests:

```sh
PW_TEST_CONNECT_WS_ENDPOINT=ws://127.0.0.1:3000/ npx playwright test
```
