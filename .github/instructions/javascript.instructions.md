---
applyTo: '**/*.js'
---
# JavaScript Instructions

- Follow StandardJS conventions used by the repo: 2-space indentation and no semicolons.
- Keep responsibilities separated:
  - `main.js` for bootstrap and sizing
  - `uiController.js` for DOM wiring
  - `audioHandler.js` for Web Audio lifecycle
  - `spectrogramRenderer.js` for drawing and note overlay behavior
  - `colorThemes.js` and `utils/` for reusable helpers
- Add or maintain JSDoc for exported functions and non-obvious logic.
- Prefer small, focused functions and avoid duplicating logic across modules.
- Do not document or expose unfinished UI paths as stable features without checking the DOM and runtime behavior.
- When visual token work begins, avoid hard-coding new palette values in JavaScript if the same value belongs in CSS.
