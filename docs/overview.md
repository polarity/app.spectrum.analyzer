# Project Overview

## Summary

`app.spectrum.analyzer` is a static browser app that visualizes live audio input as a realtime frequency spectrum. It uses the Web Audio API for microphone capture and FFT analysis, then renders the result directly to a `<canvas>` element.

The project is intentionally simple:

- no framework
- no build step
- no bundler
- static hosting through `http-server`

## Current Runtime Flow

1. `index.html` loads the canvas, a compact controls shell, explanatory copy, and `main.js`.
2. `main.js` waits for `DOMContentLoaded`, calls `setupAudio()`, sizes the canvas, and dynamically creates sliders and color pickers.
3. `audioSetup.js` enumerates audio input devices, restores the saved device from `localStorage`, and binds the start button.
4. When the user clicks `Start Audio Analysis`, the app creates an `AudioContext`, attaches an `AnalyserNode`, and connects the selected microphone input.
5. `drawingFunctions.js` starts a `requestAnimationFrame` loop that:
   - pulls analyser data
   - applies slope weighting
   - computes RMS history
   - draws peak and RMS spectra
   - detects dominant peaks
   - renders frequency/note labels and guide lines

## File Responsibilities

- `index.html`
  - static shell for canvas, controls, text, and footer
- `styles.css`
  - basic page layout and control styling
- `main.js`
  - app bootstrap and event wiring
- `audioSetup.js`
  - audio device selection and analyser lifecycle
- `audioProcessing.js`
  - threshold/RMS/slope state and helper math
- `drawingFunctions.js`
  - visualization loop and canvas drawing
- `uiComponents.js`
  - DOM creation for sliders and color inputs
- `utils.js`
  - note detection, log scaling, calibration, and color state

## Current Strengths

- Very small surface area and easy local hosting
- Immediate fullscreen visualization
- Useful audio-analysis controls already exist
- Dynamic peak labeling with frequency and note estimation

## Current Constraints

- Theme colors are split between CSS and JavaScript rather than driven from shared tokens.
- `uiComponents.js` creates controls with inline spacing styles instead of reusable classes.
- The layout is simple but visually inconsistent with `app.vectorscope`, which already has a stronger vendor identity.
- The codebase is flat at the repo root, which is workable now but can get noisy as features grow.

## Near-Term Direction

The next logical pass is a visual-system cleanup rather than a large refactor:

- keep the fullscreen spectrum layout
- align palette, surfaces, borders, and controls with `app.vectorscope`
- introduce shared CSS custom properties for theme values
- let canvas rendering read from those tokens instead of hard-coded JS colors
