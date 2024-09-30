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

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  await setupAudio();
  canvas = document.getElementById('analyzer');
  ctx = canvas.getContext('2d');

  // Set initial canvas size
  resizeCanvas(canvas);

  // Add event listener for window resize
  window.addEventListener('resize', () => resizeCanvas(canvas));

  // Initialize UI components
  initializeThresholdSlider();
  
  // Add other UI components
  addSlider('rmsWindow', 'RMS Window', 100, 20000, getRmsWindowSize(), value => {
    setRmsWindowSize(parseInt(value));
  });
  addSlider('slopeWeight', 'Slope Weight', 0, 6, getSlopeWeight(), value => {
    setSlopeWeight(parseFloat(value));
  });

  // Function to add color picker and set initial color
  function addColorPickerWithInitialColor(id, label, initialColor, setColorFunction) {
    const hexColor = rgba2hex(initialColor);
    addColorPicker(id, label, hexColor.slice(0, 7), value => {
      setColorFunction(value);
    });
    setColorFunction(initialColor);
  }

  // Add color pickers and set initial colors
  addColorPickerWithInitialColor('peakColor', 'Peak Color', peakColor, setPeakColor);
  addColorPickerWithInitialColor('peakBackgroundColor', 'Peak Background Color', peakBackgroundColor, setPeakBackgroundColor);
  addColorPickerWithInitialColor('rmsColor', 'RMS Color', rmsColor, setRmsColor);
  addColorPickerWithInitialColor('labelColor', 'Label Color', labelColor, setLabelColor);
  addColorPickerWithInitialColor('labelBackgroundColor', 'Label Background Color', labelBackgroundColor, setLabelBackgroundColor);
  addColorPickerWithInitialColor('labelTextColor', 'Label Text Color', labelTextColor, setLabelTextColor);
  addColorPickerWithInitialColor('frequencyLineColor', 'Frequency Line Color', frequencyLineColor, setFrequencyLineColor);

  // Add toggle functionality for controls
  const toggleButton = document.getElementById('controls-toggle');
  const controlsContent = document.getElementById('controls-content');
  toggleButton.addEventListener('click', () => {
    controlsContent.classList.toggle('visible');
    resizeCanvas(canvas);
  });

  // Start drawing when the "Start Audio Analysis" button is clicked
  const startButton = document.getElementById('controls-start-button');
  startButton.addEventListener('click', () => {
    draw(ctx, canvas);
  });
}

/**
 * Helper function to convert RGBA color to hex
 * @param {*} color 
 * @returns 
 */
function rgba2hex(color) {
  if (color.startsWith('#')) {
    // when color is already hex, add ff to make it rgba
    return color.length === 7 ? color + 'ff' : color;
  }
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
  return rgb ? "#" + 
    ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
    ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
    ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) +
    (rgb[4] ? ("0" + Math.round(parseFloat(rgb[4]) * 255).toString(16)).slice(-2) : "ff") : color;
}