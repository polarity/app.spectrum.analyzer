// Global variables for audio processing settings
let slopeWeight = 0
let rmsWindowSize = 15000
let thresholdDb = -7 // Set the initial threshold value
let thresholdValue = 0

/**
 * Initializes the threshold value by converting the dB value to a linear scale.
 * This function should be called once at the start to set up the initial threshold.
 */
function initializeThresholdValue() {
  setThresholdDb(thresholdDb)
}

/**
 * Gets the current slope weight value.
 * @returns {number} The current slope weight.
 */
export function getSlopeWeight() { return slopeWeight }

/**
 * Sets the RMS window size in milliseconds.
 * This affects the smoothing of the RMS calculation over time.
 * @param {number} value - The new RMS window size in milliseconds.
 */
export function setRmsWindowSize(value) { 
  rmsWindowSize = value
}

/**
 * Sets the slope weight for frequency response adjustment.
 * Higher values will emphasize higher frequencies more.
 * @param {number} value - The new slope weight value.
 */
export function setSlopeWeight(value) { slopeWeight = value; }

/**
 * Sets the threshold in decibels and updates the linear threshold value.
 * This is used to determine the cutoff point for audio visualization.
 * @param {number} value - The new threshold value in decibels.
 */
export function setThresholdDb(value) { 
  thresholdDb = value;
  // Convert dB to linear scale (0-255)
  thresholdValue = Math.pow(10, thresholdDb / 20) * 255;
}

/**
 * Gets the current threshold value in decibels.
 * @returns {number} The current threshold in decibels.
 */
export function getThresholdDb() { return thresholdDb; }

/**
 * Gets the current RMS window size in milliseconds.
 * @returns {number} The current RMS window size.
 */
export function getRmsWindowSize() { return rmsWindowSize; }

/**
 * Gets the current threshold value in linear scale (0-255).
 * This is used for comparison with audio data values.
 * @returns {number} The current threshold value in linear scale.
 */
export function getThresholdValue() {
  return thresholdValue; // Use the calculated value instead of the DOM element
}

/**
 * Calculates the Root Mean Square (RMS) of an array of numbers.
 * RMS is a measure of the magnitude of a set of numbers.
 * @param {number[]} array - The input array of numbers.
 * @returns {number} The calculated RMS value.
 */
export function calculateRMS(array) {
  return Math.sqrt(array.reduce((acc, val) => acc + val * val, 0) / array.length);
}

/**
 * Applies slope weighting to the frequency data array.
 * This function emphasizes higher frequencies based on the slope weight.
 * @param {Uint8Array} dataArray - The frequency data array to be weighted.
 * @param {number} bufferLength - The length of the data array.
 */
export function applySlopeWeighting(dataArray, bufferLength) {
  for (let i = 0; i < bufferLength; i++) {
    const factor = Math.pow(10, slopeWeight * Math.log10((i + 1) / bufferLength) / 20);
    dataArray[i] *= factor;
  }
}

/**
 * Updates the RMS history and calculates new RMS values.
 * This function maintains a rolling window of audio data and computes RMS for each frequency bin.
 * @param {Uint8Array} dataArray - The current frequency data array.
 * @param {number[][]} rmsHistory - The history of RMS values for each frequency bin.
 * @param {Float32Array} rmsDataArray - The array to store calculated RMS values.
 * @param {number} bufferLength - The length of the data arrays.
 */
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