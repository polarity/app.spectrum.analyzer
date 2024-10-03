import { setThresholdDb, getThresholdDb } from './audioProcessing.js';

/**
 * Adds a slider to the DOM for adjusting settings.
 * @param {string} id - The ID of the slider.
 * @param {string} label - The label text for the slider.
 * @param {number} min - The minimum value of the slider.
 * @param {number} max - The maximum value of the slider.
 * @param {number} value - The current value of the slider.
 * @param {function} onChange - The function to call when the slider value changes.
 */
export function addSlider(id, label, min, max, value, onChange) {
  const container = document.createElement('div');
  container.style.margin = '10px 0';
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: `;
  labelElement.setAttribute('for', id);
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = id;
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.addEventListener('input', e => onChange(e.target.value));
  container.appendChild(labelElement);
  container.appendChild(slider);
  document.getElementById('controls-content').appendChild(container);
}

/**
 * Adds a color picker to the DOM for selecting colors.
 * @param {string} id - The ID of the color picker.
 * @param {string} label - The label text for the color picker.
 * @param {string} defaultColor - The default color value.
 * @param {function} onChange - The function to call when the color is changed.
 */
export function addColorPicker(id, label, defaultColor, onChange) {
  const container = document.createElement('div');
  container.style.margin = '10px 0';
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: `;
  labelElement.setAttribute('for', id);
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.id = id;
  picker.value = defaultColor;
  picker.addEventListener('input', e => onChange(e.target.value));
  container.appendChild(labelElement);
  container.appendChild(picker);
  document.getElementById('controls-content').appendChild(container);
}

/**
 * Initializes the threshold slider for adjusting the threshold value.
 * This function adds a slider to the DOM for setting the threshold in decibels.
 * It also sets up the initial value and updates the threshold when the slider changes.
 * 
 * @returns {void}
 */
export function initializeThresholdSlider() {
  const initialThresholdDb = getThresholdDb();
  addSlider('threshold', 'Threshold', -30, 0, initialThresholdDb, (value) => {
    const dbValue = parseFloat(value);
    setThresholdDb(dbValue);
  });
}