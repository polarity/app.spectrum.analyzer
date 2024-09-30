let slopeWeight = 0;
let rmsWindowSize = 2000;
let thresholdDb = -20;
let thresholdValue = 0;

export function getSlopeWeight() { return slopeWeight; }
export function setRmsWindowSize(value) { rmsWindowSize = value; }
export function setSlopeWeight(value) { slopeWeight = value; }
export function setThresholdDb(value) { 
  thresholdDb = value;
  thresholdValue = Math.pow(10, thresholdDb / 20) * 255;
}
export function getThresholdDb() { return thresholdDb; }
export function getRmsWindowSize() { return rmsWindowSize; }
export function getThresholdValue() { return thresholdValue; }

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
      rmsHistory[i].shift();
    }
    rmsDataArray[i] = calculateRMS(rmsHistory[i]);
  }
}