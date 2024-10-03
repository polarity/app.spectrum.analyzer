import { setupAudio } from './audioSetup.js';
import { addSlider, addColorPicker, initializeThresholdSlider } from './uiComponents.js';
import { draw, resizeCanvas } from './drawingFunctions.js';
import { 
  getThresholdDb, setThresholdDb, 
  getRmsWindowSize, setRmsWindowSize, 
  getSlopeWeight, setSlopeWeight 
} from './audioProcessing.js';
import { 
  peakColor, peakBackgroundColor, rmsColor, labelColor, labelBackgroundColor, labelTextColor, frequencyLineColor,
  setPeakColor, setPeakBackgroundColor, setRmsColor, setLabelColor, setLabelBackgroundColor, setLabelTextColor, setFrequencyLineColor
} from './utils.js';

let canvas, ctx;

/**
 * Event listener for DOMContentLoaded event.
 * Initializes the application when the DOM is fully loaded.
 * This ensures all HTML elements are available before JavaScript starts manipulating them.
 */
document.addEventListener('DOMContentLoaded', () => {
  init();
});

/**
 * Initializes the audio analyzer application.
 * This function serves as the main entry point for the application's functionality.
 * It sets up the audio context, canvas, UI components, and event listeners.
 * The function is marked as async to allow for the use of await with setupAudio().
 * @async
 */
async function init() {
  // Set up audio processing
  await setupAudio();
  
  // Get canvas and context for drawing
  canvas = document.getElementById('analyzer');
  ctx = canvas.getContext('2d');

  // Set initial canvas size and add resize listener
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  // Initialize UI components
  initializeThresholdSlider();
  
  // Add sliders for RMS window and slope weight
  addSlider('rmsWindow', 'RMS Window', 100, 20000, getRmsWindowSize(), value => {
    setRmsWindowSize(parseInt(value));
  });
  addSlider('slopeWeight', 'Slope Weight', 0, 6, getSlopeWeight(), value => {
    setSlopeWeight(parseFloat(value));
  });

  // Add color pickers for various visual elements
  addColorPickerWithInitialColor('peakColor', 'Peak Color', peakColor, setPeakColor);
  addColorPickerWithInitialColor('peakBackgroundColor', 'Peak Background Color', peakBackgroundColor, setPeakBackgroundColor);
  addColorPickerWithInitialColor('rmsColor', 'RMS Color', rmsColor, setRmsColor);
  addColorPickerWithInitialColor('labelColor', 'Label Color', labelColor, setLabelColor);
  addColorPickerWithInitialColor('labelBackgroundColor', 'Label Background Color', labelBackgroundColor, setLabelBackgroundColor);
  addColorPickerWithInitialColor('labelTextColor', 'Label Text Color', labelTextColor, setLabelTextColor);
  addColorPickerWithInitialColor('frequencyLineColor', 'Frequency Line Color', frequencyLineColor, setFrequencyLineColor);

  // Add toggle functionality for controls
  setupControlsToggle();

  // Set up start button for audio analysis
  setupStartButton();
}

/**
 * Adds a color picker with an initial color to the UI.
 * This function creates a color picker, sets its initial value, and connects it to the corresponding setter function.
 * It's used to create consistent color pickers for various visual elements of the analyzer.
 * 
 * @param {string} id - The ID for the color picker element.
 * @param {string} label - The label text for the color picker.
 * @param {string} initialColor - The initial color value (in rgba or hex format).
 * @param {Function} setColorFunction - The function to call when the color is changed.
 */
function addColorPickerWithInitialColor(id, label, initialColor, setColorFunction) {
  const hexColor = rgba2hex(initialColor);
  addColorPicker(id, label, hexColor.slice(0, 7), value => {
    setColorFunction(value);
  });
  setColorFunction(initialColor);
}

/**
 * Sets up the toggle functionality for the controls panel.
 * This function adds a click event listener to the toggle button to show/hide the controls content.
 * It improves the user interface by allowing the user to hide the controls when not needed.
 */
function setupControlsToggle() {
  const toggleButton = document.getElementById('controls-toggle');
  const controlsContent = document.getElementById('controls-content');
  toggleButton.addEventListener('click', () => {
    controlsContent.classList.toggle('visible');
    resizeCanvas(canvas);
  });
}

/**
 * Sets up the start button for audio analysis.
 * This function adds a click event listener to the start button to begin the audio analysis and visualization.
 * It's crucial for initiating the main functionality of the analyzer.
 */
function setupStartButton() {
  const startButton = document.getElementById('controls-start-button');
  startButton.addEventListener('click', () => {
    draw(ctx, canvas);
  });
}

/**
 * Converts an RGBA color string to a hex color string.
 * This helper function is used to ensure consistent color format for color pickers.
 * It handles both hex and rgba input formats, always returning an 8-digit hex color (including alpha).
 * 
 * @param {string} color - The color to convert (can be in rgba or hex format).
 * @returns {string} The color in 8-digit hex format (including alpha).
 */
function rgba2hex(color) {
  if (color.startsWith('#')) {
    // When color is already hex, add ff to make it rgba if needed
    return color.length === 7 ? color + 'ff' : color;
  }
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
  return rgb ? "#" + 
    ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
    ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
    ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) +
    (rgb[4] ? ("0" + Math.round(parseFloat(rgb[4]) * 255).toString(16)).slice(-2) : "ff") : color;
}