# ScreenSense Zoom Vision

## Product Summary

ScreenSense Zoom is a Chrome extension for individual users who work across multiple displays and want browser zoom to feel correct without manually adjusting it every time their screen context changes.

The core problem is not window sizing. The problem is page zoom drift. A zoom level that feels right on a 27-inch external monitor can feel oversized on a 14-inch laptop display after undocking or moving between screens. The extension should make that transition feel automatic.

## Vision

The product should quietly apply the right page zoom for the current browsing context without making the user think about it.

For MVP, the highest-priority outcome is:

- when a user visits a tab, the tab should use the zoom that matches the current display context and domain-specific preferences
- when the active tab remains open but the Chrome window effectively moves to a different display context, the tab should be re-evaluated and updated
- when the product has no matching rule, it should stay out of the way and respect Chrome's current zoom

## Target User

The initial user is an individual who extends their workspace across multiple displays, especially a laptop plus an external monitor, and frequently moves between those contexts.

Example primary workflow:

- user works mostly on a large external monitor
- user uses a zoom level that feels right there
- user disconnects from the monitor or moves Chrome to a smaller screen
- the same pages now feel visually too large
- the extension should correct that without requiring manual zoom changes every time

## Core Product Principles

- Prioritize invisible automation over frequent user control
- Default behavior should apply across all sites unless the user explicitly overrides it
- Domain-specific behavior should be precise and narrow
- User-defined rules should sync across Chrome profiles
- The product should remain silent unless the user opens the popup or options page

## Scope

### In Scope for MVP

- Apply zoom for normal Chrome tabs
- Use per-tab zoom behavior
- Use effective screen resolution as the matching key
- Support both moving windows between displays and dock/undock transitions
- Ship a small opinionated set of common default resolution rules
- Allow user overrides for specific domain and resolution pairs
- Sync user-defined rules across Chrome profiles
- Provide quick-save from the popup for the current domain and current resolution
- Provide an options page for rule management
- Provide JSON import/export for user-defined rules

### Out of Scope for MVP

- Chrome internal pages
- PDFs
- new tab and other non-normal tab surfaces
- incognito support
- onboarding UX or permissions education
- proactive background-tab updates
- import/export of built-in defaults

## Resolution Model

The extension should key matching by normalized exact `width x height` using the browser-reported available screen size for the active display context.

Rules:

- orientation should be normalized, so portrait and landscape representations of the same display dimensions map to the same resolution class
- matching should require an exact normalized resolution match
- the chosen display should be the one containing the majority of the Chrome window when the window spans multiple displays

This is an intentionally practical definition of screen context. It should reflect the usable browser-visible area rather than the display panel's raw full resolution.

## Rule Model

The product has three logical layers:

1. Built-in global resolution defaults shipped with the extension
2. User-customized global resolution rules
3. User domain-and-resolution overrides

Precedence:

1. Domain override for `domain + resolution`
2. User-customized or built-in global rule for `* + resolution`
3. If nothing matches, respect Chrome's current zoom

There is no forced 100% fallback in the final MVP vision.

### Domain Granularity

- Rules apply at the exact domain level, such as `docs.google.com`
- Rules do not automatically broaden to the parent site, such as `google.com`

### Storage Semantics

- User-defined rules should sync across Chrome profiles
- Built-in shipped defaults should remain a distinct layer
- When a user edits a built-in default, the result should be stored as a synced user customization layered over the shipped default, not by mutating the bundled rule itself
- The extension should remember user settings per `domain + resolution`

## Trigger Behavior

### Apply Zoom

The main trigger is tab activation.

When a normal tab becomes active, the extension should evaluate the current domain and current effective resolution and apply the best matching rule for that tab.

### Re-Apply Zoom Without Tab Switch

If the same active tab stays active but its Chrome window effectively moves to a different display context, the extension should re-evaluate and re-apply based on the new resolution context.

### Navigation Behavior

- If a tab navigates within the same domain, the same rule should continue
- If a tab navigates to a different domain while staying active, the extension should not immediately switch rules
- The new domain's rule should apply only the next time that tab is activated

### Startup Behavior

When Chrome or the extension starts, the extension should wait until the user changes or activates a tab. It should not immediately sweep currently active tabs on startup.

## Manual Zoom Behavior

- If a user manually changes zoom without saving, that manual value is not authoritative
- The next time the tab is evaluated against a matching config entry, the configured rule should win
- If no rule matches, the extension should respect the current Chrome zoom rather than forcing a default

## Popup MVP

The popup should stay minimal and focused on the current context.

It should show:

- current domain
- current effective resolution
- current applied zoom

It should support:

- save current zoom for the current `domain + resolution`
- delete the current `domain + resolution` override

Deletion behavior:

- if a matching global resolution rule exists, the tab should immediately fall back to that global rule
- otherwise the tab should move back to whatever Chrome zoom is currently in effect

The popup should not act as the full management surface.

## Options Page MVP

The options page is primarily a rule table and editor.

Capabilities:

- create rules
- edit rules
- delete rules
- search and filter by domain text
- import user-defined rules from JSON
- export user-defined rules to JSON
- review and resolve import conflicts in a dedicated UI

### Table Behavior

- The main table should show only the user's editable layer
- Built-in defaults should be implicit in the main table until overridden
- Global rules and domain overrides can appear in the same table
- Global rules should display `*` in the domain column
- The visible data columns required for MVP are `domain`, `resolution`, and `zoom`
- Rule type should still be visually distinguishable, even if not treated as a primary editable field

### Built-In Defaults View

Because built-ins are implicit in the main table, the options page should include a separate view to reveal shipped defaults and allow the user to customize them.

Editing a built-in there should create a synced user-layer customization for that resolution.

## Import and Export

For MVP:

- format is JSON
- export includes only user-defined rules
- import merges into existing user-defined rules
- if an imported rule conflicts with an existing user-defined rule for the same key, the user must resolve the conflict in the options-page review UI

## Product Personality

The extension should feel quiet, mechanical, and trustworthy.

It should not:

- interrupt users with notifications
- explain itself constantly
- preemptively modify background tabs

It should:

- apply rules when the user actually engages with a tab
- update the active tab when screen context changes
- make exceptions easy to save and manage

## Non-Goals and Guardrails

- This product is not a window manager
- This product is not trying to infer a user's preferences through heavy automation or onboarding
- This product should not broaden domain-specific rules beyond the exact domain
- This product should not rely on hidden mutation of shipped defaults

## MVP Success Criteria

The MVP is successful if a user who switches between a large external monitor and a smaller laptop display can browse normally and feel that tab zoom is usually correct without needing to think about it.

When the automation gets it wrong, the correction path should be fast:

- open popup
- save current zoom for current domain and current resolution

When broader configuration is needed, the options page should provide direct rule editing without becoming a tutorial or dashboard-heavy product.
