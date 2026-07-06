# Playwright AI Test Inspector

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
docs/           Project documentation
scripts/        Utility scripts
.github/        GitHub Actions workflows

```

---



## Current Status

🚧 Phase 1 in progress — M1 (Project Foundation) complete.

The repository is being developed incrementally, with each milestone focusing on learning, maintainability, and production-quality engineering practices.

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

If a previous `playwright install` appears stuck, press **Ctrl+C** and run `npm run setup` again.

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
npm run test:ui
npm run test:headed
npm run report
```

If tests fail with a missing browser error, run:

```bash
npm run playwright:install
```

---



## AI Modules



### AI Failure Analyzer

The first planned AI module will assist with failed Playwright test investigations.

It will collect information such as:

- stack traces
- Playwright traces
- screenshots
- console logs
- network failures

and generate a structured Markdown report containing:

- failure summary
- likely root cause
- failure classification
- suggested debugging steps
- confidence level

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

- [ ] Initialize React application

- [ ] Configure Tailwind CSS

- [ ] Implement fake authentication

- [ ] Build product catalogue

- [ ] Build shopping cart

- [ ] Implement checkout flow

- [ ] Add responsive layout



### Playwright

- [ ] Configure Playwright

- [ ] Create Page Object Model

- [ ] Implement fixtures

- [ ] Organize test data

- [ ] Generate HTML reports

- [ ] Enable Trace Viewer

- [ ] Capture screenshots and videos

- [ ] Add smoke tests

- [ ] Add end-to-end test suite



### CI/CD

- [ ] Configure GitHub Actions

- [ ] Upload test artifacts

- [ ] Publish Playwright reports



### AI

- [ ] AI Failure Analyzer

- [ ] Failure classification

- [ ] AI investigation reports

- [ ] AI debugging suggestions



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