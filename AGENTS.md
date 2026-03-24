# AGENTS.md

This repository expects coding agents to follow the rules below.

## Primary references

Use these sources as the default reference order whenever they are relevant:

1. Chrome Extension APIs: [https://developer.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions)
2. Web APIs: [https://developer.mozilla.org/docs/Web/API](https://developer.mozilla.org/docs/Web/API)
3. Architectural structure reference: [https://github.com/obsidianmd/obsidian-clipper.git](https://github.com/obsidianmd/obsidian-clipper.git)

## Architecture expectations

- Follow the same high-level architectural structure as `obsidian-clipper`.
- Keep browser-extension responsibilities split by context, not collapsed into a single entry point.
- Prefer a centralized background message-routing pattern.
- Keep page DOM logic in content scripts and UI logic in dedicated UI entry points.
- Preserve browser-specific manifests and multi-target build organization.

## Runtime and package management

- Always use Bun for dependency installation, script execution, and runtime tasks.
- Prefer `bun install` over `npm install`.
- Prefer `bun run <script>` over `npm run <script>`.
- Do not introduce `package-lock.json` or npm-specific workflow requirements.

## Skills

- Whenever appropriate, invoke the `web-design-guidelines` skill for UI/UX review and standards checks.
- Whenever appropriate, invoke the `frontend-design` skill for frontend implementation, layout, styling, and interface design work.
- For frontend tasks, use both skills when the task benefits from both implementation and guideline review.

## Delegation

- Prefer spinning up sub-agents and delegating bounded tasks instead of doing all work in the main agent context.
- Keep the main agent focused on coordination, integration, and final verification.
- Delegate concrete implementation, investigation, or verification tasks when they can be scoped cleanly.
- Avoid unnecessary duplication between the main agent and sub-agents.

## Implementation guidance

- Favor official documentation over blog posts or third-party summaries.
- For extension behavior, check Chrome extension documentation first, then MDN when the concern is a browser or DOM API.
- When adapting patterns from `obsidian-clipper`, preserve structure and communication boundaries rather than copying product-specific behavior.
