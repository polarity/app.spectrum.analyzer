---
applyTo: '**/*.html'
---
# HTML Instructions

- Keep metadata tags, footer links, and the external stylesheet/module bootstrap intact unless the task explicitly changes them.
- Keep structure semantic and accessibility-aware.
- Avoid inline styles when the same presentation belongs in `style.css`.
- Keep control IDs synchronized with the selectors used in `uiController.js` and `main.js`.
- If a control is removed from the DOM, verify that the related JavaScript path is also updated.
