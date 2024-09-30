import { setThresholdDb, getThresholdDb } from './audioProcessing.js';

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

export function initializeThresholdSlider() {
  const initialThresholdDb = getThresholdDb();
  addSlider('threshold', 'Threshold', -30, 0, initialThresholdDb, (value) => {
    const dbValue = parseFloat(value);
    setThresholdDb(dbValue);
  });
}