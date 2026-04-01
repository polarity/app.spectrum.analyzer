# Spectrum Analyzer

Spectrum Analyzer is a browser-based audio analysis app built with vanilla HTML, CSS, and JavaScript. It captures a live audio input, computes FFT data in the browser, and renders a realtime fullscreen spectrum on canvas.

Try it on the web: [Demo](https://spectrum.polarity.me)

## Features

- Realtime frequency spectrum rendering on canvas
- Peak and RMS spectrum overlays
- Dominant-frequency labels with note and cents estimation
- Log-scaled frequency layout
- Adjustable threshold, RMS window, and slope weighting
- Live color customization for spectrum and labels
- Audio input device selection with saved preference

## Requirements

- A modern browser with Web Audio support
- Node.js and npm for the local static server

## Installation

1. Clone this repository.
2. Move into the project directory.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the local server:

   ```bash
   npm start
   ```

5. Open the local URL printed by `http-server` (typically `http://localhost:8080`).

## Usage

1. Open the app in your browser.
2. Click `Start Audio Analysis`.
3. Allow microphone access when prompted.
4. Choose an input device if multiple microphones are available.
5. Expand the controls panel to adjust threshold, RMS window, slope weighting, and colors.

## Project Structure

```text
app.spectrum.analyzer/
|- index.html
|- styles.css
|- main.js
|- audioSetup.js
|- audioProcessing.js
|- drawingFunctions.js
|- uiComponents.js
|- utils.js
|- docs/
|  |- overview.md
|  `- design-system.md
|- .github/
|  `- instructions/
|- AGENTS.md
|- README.md
`- LICENSE
```

## Design Direction

This app currently keeps a simple fullscreen analyzer layout. The intended next design pass is to align its colors, surfaces, and control styling with `app.vectorscope` so both tools feel like they come from the same vendor, while preserving the spectrum analyzer's wide full-screen presentation.

See:

- [`docs/overview.md`](docs/overview.md)
- [`docs/design-system.md`](docs/design-system.md)
- [`AGENTS.md`](AGENTS.md)

## Development Notes

- The app is served as a static site through `http-server`.
- JavaScript follows StandardJS style.
- There is currently no automated test suite; verify behavior manually in the browser.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
