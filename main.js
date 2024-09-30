import { setupAudio } from './audioSetup.js';
import { addSlider, addColorPicker } from './uiComponents.js';
import { draw, resizeCanvas } from './drawingFunctions.js';
import { 
  getThresholdDb, setThresholdDb, 
  getRmsWindowSize, setRmsWindowSize, 
  getSlopeWeight, setSlopeWeight 
} from './audioProcessing.js';
import { peakColor, rmsColor, labelColor } from './utils.js';

let canvas, ctx;

async function init() {
  await setupAudio();
  canvas = document.getElementById('analyzer');
  ctx = canvas.getContext('2d');

  // Set initial canvas size
  resizeCanvas(canvas);

  // Add event listener for window resize
  window.addEventListener('resize', () => resizeCanvas(canvas));

  // Add UI components
  addSlider('rmsWindow', 'RMS Window', 100, 20000, getRmsWindowSize(), value => {
    setRmsWindowSize(parseInt(value));
  });
  addSlider('slopeWeight', 'Slope Weight', 0, 6, getSlopeWeight(), value => {
    setSlopeWeight(parseFloat(value));
  });
  addSlider('threshold', 'Threshold', -100, 0, getThresholdDb(), value => {
    setThresholdDb(parseFloat(value));
  });
  addColorPicker('peakColor', 'Peak Color', peakColor, value => peakColor = value);
  addColorPicker('rmsColor', 'RMS Color', rmsColor, value => rmsColor = value);
  addColorPicker('labelColor', 'Label Color', labelColor, value => labelColor = value);

  // Add toggle functionality for controls
  const toggleButton = document.getElementById('controls-toggle');
  const controlsContent = document.getElementById('controls-content');
  toggleButton.addEventListener('click', () => {
    controlsContent.classList.toggle('visible');
    resizeCanvas(canvas);
  });

  draw(ctx, canvas);
}

init();