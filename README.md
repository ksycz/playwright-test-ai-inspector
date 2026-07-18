# Playwright AI Test Inspector

[![Playwright Tests](https://github.com/ksycz/playwright-test-ai-inspector/actions/workflows/playwright.yml/badge.svg)](https://github.com/ksycz/playwright-test-ai-inspector/actions/workflows/playwright.yml)

A portfolio project focused on learning **Playwright** while exploring practical applications of **AI in modern test automation**.

The project combines a small demo e-commerce application with a production-inspired Playwright testing framework and a growing collection of AI-assisted testing tools.

---

## About This Project

As an experienced SDET with several years of experience using Cypress, I wanted to learn Playwright by building something practical instead of following isolated tutorials.

The primary goal is to gain hands-on experience with Playwright while exploring how AI can improve everyday software testing workflows—from investigating failed end-to-end tests to generating actionable debugging insights.

This repository is developed incrementally and serves as both a learning journey and a portfolio project.

---



## Objectives

- Learn Playwright in depth
- Build a maintainable end-to-end testing framework
- Apply modern React and TypeScript best practices
- Explore practical AI use cases in software testing
- Demonstrate clean architecture and professional engineering practices

---



## Technology Stack



### Application

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Context API
- Local Storage



### Testing

- Playwright
- Playwright Trace Viewer
- HTML Reports
- Screenshots & Videos
- Page Object Model
- Fixtures



### AI (planned)

- Failure analysis
- Failure classification
- Root cause suggestions
- AI-generated investigation reports
- Optional LLM provider integration

---



## Repository Structure

```text
app/            Demo e-commerce application
tests/          Playwright test suite
ai/             AI Failure Analyzer (Phase 3)
docs/           Project documentation
.github/        GitHub Actions workflows
```

---



## Current Status

✅ Phase 1 complete — P1-M1 through P1-M10 (59 smoke tests).

✅ Phase 2 complete — P2-M1 through P2-M8 (framework, POM, fixtures, tagged suites, E2E journeys, CI).

✅ Phase 3 complete — P3-M1 through P3-M5 (ingestion, classification, Markdown/HTML reports, optional LLM, docs polish).

**Test suites:** 59 smoke (`@smoke`) + 6 e2e (`@e2e`) + 3 fixture examples = 68 Playwright tests; plus `npm run test:ai` for analyzer unit tests.

---

## Local Development

**Requires Node.js 22.12+** (see `.nvmrc`).

If `nvm` is not found, ensure your shell loads it (add to `~/.zshrc`):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Then in the project directory:

```bash
nvm install    # installs Node 22 from .nvmrc if needed
nvm use
node -v        # should be v22.12.0 or higher
```

### One-time setup

From the repository root:

```bash
npm run setup
```

This installs root dependencies (Playwright), app dependencies, and the Chromium browser into `.playwright-browsers/` inside the project (avoids permission issues with the global cache).

**Use `npm run setup` or `npm run playwright:install` for browsers — not `npx playwright install`.**  
The raw `npx` command installs to Playwright’s default cache and can appear to hang or leave tests looking for binaries in the wrong place. This repo sets `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers` in all test scripts.

If a previous install appears stuck, press **Ctrl+C** and run `npm run playwright:install` again.

### Application

```bash
npm run dev
```

Open http://localhost:5173

```bash
npm run build
npm run preview
```

### Playwright

```bash
nvm use
npm test
npm run test:smoke
npm run test:e2e
npm run test:ui
npm run test:headed
npm run report
```

**Debugging failed tests:**

```bash
# Open HTML report from the latest run
npm run report

# Open a trace file captured on retry (path printed in test output)
npm run trace -- test-results/<test-folder>/trace.zip
```

Failure artifacts (screenshots, videos, traces) are written to `test-results/`. See `docs/TESTING.md` for the full debugging workflow.

### Continuous Integration

GitHub Actions runs Playwright on every push to `main` and on pull requests:

- **Workflow:** `.github/workflows/playwright.yml`
- **Node:** 22 (from `.nvmrc`)
- **Browsers:** project-local Chromium in `.playwright-browsers/`
- **Suites:** `test:smoke` and `test:e2e` run in parallel matrix jobs
- **On failure:** `playwright-report/` and `test-results/` are uploaded as downloadable artifacts

Local runs use `CI=true` to match CI behaviour (fresh dev server, retries, traces on first retry).

If tests fail with a missing browser error, run:

```bash
npm run playwright:install
```

---



## AI Modules



### AI Failure Analyzer

The first AI module assists with failed Playwright test investigations.

**One-command flow** (after a local or CI failure):

```bash
npm run analyze:report -- test-results/<failed-test-folder> --format both
```

That collects artifacts, classifies the failure, and writes Markdown + HTML reports under `ai-reports/`.

```bash
# Golden fixture (no Playwright run required)
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format html

# JSON-only collection
npm run analyze:failure -- test-results/<failed-test-folder>

# Analyzer unit tests
npm run test:ai
```

It collects information such as:

- stack traces / error context (`error-context.md`)
- Playwright traces
- screenshots
- videos

Then classifies the failure and writes a structured report with suggested next steps (Markdown by default; HTML via `--format html`).

Optional LLM root-cause suggestions run when `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set (`--llm` / `--no-llm` override). Without keys, everything stays offline.

Sanitized sample report: [`docs/samples/failure-investigation-report.md`](docs/samples/failure-investigation-report.md).  
Module docs: [`ai/failure-analyzer/README.md`](ai/failure-analyzer/README.md).

On CI failure, download the `test-results-*` artifact, unzip, and point `analyze:report` at the failed folder — see Testing docs for the full workflow.

The goal is not to replace engineers, but to reduce investigation time and improve debugging efficiency.

### Future AI Modules

- Flaky Test Detection
- AI Test Execution Summary
- Locator Change Suggestions
- Pull Request Test Summaries
- Historical Failure Trends
- Visual Regression Insights

---



## Development Principles

This project follows several engineering principles:

- Clean Architecture
- Readable and maintainable code
- Strong TypeScript typing
- Reusable components
- Stable Playwright locators
- Accessible UI
- Small, focused Git commits
- AI used as an engineering assistant—not as a replacement for engineering judgment

---



## Documentation

Additional documentation is available in the `docs` directory.

- `PROJECT.md` — project vision and development principles
- `ARCHITECTURE.md` — architectural decisions
- `AI_GUIDELINES.md` — guidelines for AI-assisted development
- `LESSONS_LEARNED.md` — learning notes and technical discoveries
- `TESTING.md` — Playwright framework conventions and structure
- `ROADMAP.md` — milestone plan and progress log
- `samples/failure-investigation-report.md` — sanitized analyzer sample report

---



## Development Workflow

The project is developed incrementally.

Each milestone includes:

1. Planning the implementation
2. Building the feature
3. Reviewing the architecture
4. Documenting important decisions
5. Maintaining a clean Git history

---

## Project Roadmap



### MVP

- [x] Initialize React application

- [x] Configure Tailwind CSS

- [x] Implement fake authentication

- [x] Build product catalogue

- [x] Build shopping cart

- [x] Implement checkout flow

- [x] Add responsive layout



### Playwright

- [x] Configure Playwright

- [x] Create Page Object Model

- [x] Implement fixtures

- [x] Organize test data

- [x] Generate HTML reports

- [x] Enable Trace Viewer

- [x] Capture screenshots and videos

- [x] Add smoke tests

- [x] Add end-to-end test suite



### CI/CD

- [x] Configure GitHub Actions

- [x] Upload test artifacts

- [x] Publish Playwright reports



### AI

- [x] AI Failure Analyzer

- [x] Failure classification

- [x] AI investigation reports

- [x] AI debugging suggestions



### Future Enhancements

- [ ] API testing with Playwright

- [ ] Visual regression testing

- [ ] Flaky test detection

- [ ] AI-generated Pull Request summaries

- [ ] Historical failure trend analysis

---



## Learning Goals

This repository documents my journey of learning:

- Playwright
- Modern React architecture
- TypeScript
- End-to-end testing best practices
- AI-assisted software engineering
- Practical AI applications in software quality assurance

---



## License

This repository is intended for educational and portfolio purposes.