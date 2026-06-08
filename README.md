# Visual Regression Tester

**Visual Regression Tester** takes screenshots of a **reference website** and compares
them with screenshots of a **subject website**. This can be used to automatically identify
unintended visual changes introduced by updates or refactorings, for example:

* switching the frontend build system (e. g. from webpack to Vite)
* upgrading the content management system (e. g. from TYPO3 v12 to TYPO3 v13)

Visual Regression Tester encourages a workflow where **the playwright test runner and the
user** collaborate on a shared report file. With each test run, the report is updated
and refined.

The user can manually **accept** both passing and failing tests. Accepted tests are skipped
in future runs. Over time, more tests become accepted: either because playwright verifies
them automatically or because the user reviews and approves the remaining failures.

The goal is for every test to reach the **accepted** state.

## Getting started

### 1. Initialize project

You can use the [visual-regression-starter](https://github.com/s2b/visual-regression-starter)
to setup your project:

```sh
git clone --depth=1 https://github.com/s2b/visual-regression-starter.git visual-regression-project
cd visual-regression-project
rm -rf .git && git init
npm install
```

### 2. Configure visual regression tester

Set the reference url (e. g. your production system) and the subject url (e. g. your
development system) in `visualregression.config.ts`:

```js
export default defineConfig({
  referenceUrl: "https://www.example.com",
  subjectUrl: "https://example.ddev.site",
});
```

See [Config](./src/types.ts) for all available configuration options.

### 3. Adjust playwright test file

A boilerplate test file is available in `tests/visualregression.spec.ts`, which should work
out-of-the-box. However, depending on the features of the website you'd like to test,
this file might need some adjustments, for example:

* Closing cookie banners or hiding other fixed elements via [Locators](https://playwright.dev/docs/locators)
  or [page.evaluate()](https://playwright.dev/docs/evaluating)
* [Mocking API calls](https://playwright.dev/docs/mock)

See also `TestSnippets.md` in the project directory.

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
