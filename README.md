# Spectrum Analyzer
Try it out [on the web: Demo](https://spectrum.polarity.me)

## Description
This Spectrum Analyzer is a web-based application that visualizes the frequency spectrum of audio inputs in real-time. It offers an interactive and customizable display of audio frequencies, ideal for musicians, sound engineers, or anyone interested in audio analysis.

## Key Features
- Real-time frequency analysis of audio inputs
- Logarithmic frequency display
- Peak and RMS spectrum visualization
- Identification and display of dominant frequencies with corresponding note names
- Adjustable settings for RMS window, slope weighting, and threshold
- Customizable color interface

## Installation
1. Ensure that [Node.js](https://nodejs.org/) is installed on your system.
2. Clone this repository or download it.
3. Open a terminal in the project directory.
4. Run the following command to install dependencies:
   ```
   npm install
   ```

## Usage
1. Start the server with the command:
   ```
   npm start
   ```
2. Open a web browser and navigate to `http://localhost:8080` (or the port displayed in the console).
3. Allow the browser to access your microphone when prompted.
4. Use the controls at the bottom of the screen to adjust the display.

## Customization
- RMS Window: Adjusts the smoothing of the RMS spectrum.
- Slope Weighting: Changes the weighting of higher frequencies.
- Threshold: Determines at what intensity frequencies are considered significant.
- Color Settings: Customize colors for peak spectrum, RMS spectrum, and labels.

## Technologies
- HTML5 Canvas for visualization
- Web Audio API for audio analysis
- JavaScript ES6+ for logic and interactivity

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contribution
Contributions are welcome! Please open an issue to discuss major changes before submitting a pull request.