# Agents Guide

This file gives coding agents a project-specific guide for `app.spectrum.analyzer`.

## Project Scope

- This repository is a browser-based spectrum analyzer built with vanilla HTML, CSS, and JavaScript modules.
- The app captures live audio input, computes FFT data in the browser, and renders a fullscreen frequency spectrum on canvas.
- Keep the project framework-free unless the user explicitly asks for a stack change.

## Architecture Map

- `index.html`: Entry document, metadata, root canvas, controls shell, descriptive copy, and footer links.
- `styles.css`: Current global layout and control styling.
- `main.js`: App bootstrap, UI assembly, start button wiring, and canvas setup.
- `audioSetup.js`: Audio device enumeration, `AudioContext` creation, analyzer setup, and media stream connection.
- `audioProcessing.js`: Threshold, RMS, and slope-weight state plus spectrum-processing helpers.
- `drawingFunctions.js`: Main render loop, canvas resize logic, peak detection, labels, and guide rendering.
- `uiComponents.js`: Dynamic slider and color-picker creation for the controls panel.
- `utils.js`: Shared colors, frequency helpers, note detection, and calibration logic.
- `.github/instructions/`: Editor and agent guidance already present in the repo; keep new docs aligned with it.
- `docs/overview.md`: Human-readable project overview and runtime flow.
- `docs/design-system.md`: Current visual direction and target alignment with `app.vectorscope`.

## Conventions To Follow

- JavaScript style follows StandardJS conventions used in the repo:
  - 2-space indentation
  - No semicolons
- Keep UI/bootstrap logic in `main.js`, audio device and analyzer setup in `audioSetup.js`, and drawing logic in `drawingFunctions.js`.
- Preserve the current fullscreen spectrum layout unless the user explicitly asks for a structural UI change.
- When adjusting visuals, prefer centralized theme tokens in CSS over adding more hard-coded colors in JS or inline styles.
- Avoid introducing frameworks, build tooling, or bundlers for simple changes.

## Documentation Rules

- Keep `README.md` short and user-facing.
- Keep this file operational and navigation-focused.
- Keep detailed project notes in `docs/`.
- Do not document features that are not implemented.
- If module ownership changes, update `README.md`, `AGENTS.md`, and the relevant file in `docs/`.

## Design Direction

- Preserve the spectrum analyzer's defining layout: full browser width and near-full viewport height for the canvas.
- Align the visual language with `app.vectorscope` where it makes sense:
  - darker layered backgrounds
  - shared accent palette
  - stronger surface cards and borders
  - more deliberate button, form, and footer styling
- Do not copy the vectorscope's square-stage layout into this app. Shared vendor language should come from tokens, controls, and background treatment, not from forcing identical composition.
- If a future restyle touches canvas colors, expose the same tokens to both CSS and JS so the DOM and rendering layer stay visually consistent.

## Agent Workflow

1. Read the touched module(s) before editing to preserve current patterns.
2. Keep changes focused and avoid unnecessary refactors in this flat file structure.
3. Run local verification when relevant:
   - `npm install`
   - `npm start`
4. Manually verify in a browser:
   - App loads without console errors
   - `Start Audio Analysis` prompts for microphone access
   - Audio input selection populates after permission/device enumeration
   - Controls panel toggles open and closed
   - Threshold, RMS window, and slope sliders affect rendering
   - Color pickers change the live visualization
   - Canvas remains fullscreen-responsive when resizing

## Known Constraints

- There is no automated test suite; verification is manual.
- Audio capture depends on browser permissions and available input devices.
- The current code mixes CSS styling with some DOM-created inline styles in `uiComponents.js`.
- Theme values for the canvas are currently stored in JavaScript exports rather than shared CSS variables.
- The app uses a flat root-level module layout rather than a `src/` or `js/` directory.
