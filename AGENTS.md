# AGENTS.md

## Source of truth

1. Chrome Extension APIs: [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions)
2. Web APIs: [MDN Web API Docs](https://developer.mozilla.org/docs/Web/API)

## Development workflow

1. Always follow a Red-Green TDD approach.
2. Prefer Bun for package management and script execution in this repo.
3. Use `bun install` instead of `npm install`, `yarn install`, or `pnpm install`.
4. Use `bun run <script>` instead of `npm run <script>`, `yarn run <script>`, or `pnpm run <script>`.
5. Use `bun test` for tests when the project is using Bun's test runner. If the repo is already using another test runner, keep the existing setup unless explicitly migrating it.

## Design workflow

1. When making changes to page aesthetics, visual styling, layout polish, or UI presentation, always use the [frontend-design](/.agents/skills/frontend-design/) skill.
