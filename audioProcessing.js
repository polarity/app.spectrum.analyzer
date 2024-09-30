let slopeWeight = 0;
let rmsWindowSize = 15000;
let thresholdDb = -7; // Set the initial threshold value
let thresholdValue = 0;

// Add this function to set the initial threshold value
function initializeThresholdValue() {
  setThresholdDb(thresholdDb);
}

export function getSlopeWeight() { return slopeWeight; }
export function setRmsWindowSize(value) { 
  rmsWindowSize = value;
}
export function setSlopeWeight(value) { slopeWeight = value; }
export function setThresholdDb(value) { 
  thresholdDb = value;
  // Convert dB to linear scale (0-255)
  thresholdValue = Math.pow(10, thresholdDb / 20) * 255;
}
export function getThresholdDb() { return thresholdDb; }
export function getRmsWindowSize() { return rmsWindowSize; }
export function getThresholdValue() {
  return thresholdValue; // Use the calculated value instead of the DOM element
}

export function calculateRMS(array) {
  return Math.sqrt(array.reduce((acc, val) => acc + val * val, 0) / array.length);
}

export function applySlopeWeighting(dataArray, bufferLength) {
  for (let i = 0; i < bufferLength; i++) {
    const factor = Math.pow(10, slopeWeight * Math.log10((i + 1) / bufferLength) / 20);
    dataArray[i] *= factor;
  }
}

export function updateRMSHistory(dataArray, rmsHistory, rmsDataArray, bufferLength) {
  const rmsWindowSamples = Math.floor(rmsWindowSize / (1000 / 60));

  for (let i = 0; i < bufferLength; i++) {
    rmsHistory[i].push(dataArray[i]);
    if (rmsHistory[i].length > rmsWindowSamples) {
      rmsHistory[i] = rmsHistory[i].slice(-rmsWindowSamples);
    }
    rmsDataArray[i] = calculateRMS(rmsHistory[i]);
  }
}

// Initialize threshold value
initializeThresholdValue();