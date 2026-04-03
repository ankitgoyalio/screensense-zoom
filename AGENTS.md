# AGENTS.md

Use these sources as the default reference order whenever they are relevant:

1. Chrome Extension APIs: [https://developer.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions)
2. Web APIs: [https://developer.mozilla.org/docs/Web/API](https://developer.mozilla.org/docs/Web/API)

Development workflow:

1. Always follow a Red-Green TDD approach.
2. Prefer Bun for package management and script execution in this repo.
3. Use `bun install` instead of `npm install`, `yarn install`, or `pnpm install`.
4. Use `bun run <script>` instead of `npm run <script>`, `yarn run <script>`, or `pnpm run <script>`.
5. Use `bun test` for tests when the project is using Bun's test runner. If the repo is already using another test runner, keep the existing setup unless explicitly migrating it.
