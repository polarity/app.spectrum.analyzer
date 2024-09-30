export let peakColor = '#888888';
export let peakBackgroundColor = '#88888833';
export let rmsColor = '#ffbf00';
export let labelColor = '#ffffff';
export let labelBackgroundColor = '#0069a8';
export let labelTextColor = '#ffffff';
export let frequencyLineColor = '#0069a8';

export function setPeakColor(color) {
  peakColor = color;
}

export function setRmsColor(color) {
  rmsColor = color;
}

export function setLabelColor(color) {
  labelColor = color;
}

export function logScale(index, bufferLength) {
  const logmin = Math.log(1);
  const logmax = Math.log(bufferLength);
  const scale = (Math.log(index * (bufferLength - 1) + 1) - logmin) / (logmax - logmin);
  return scale;
}

export function getNoteWithCents(frequency) {
  if (frequency <= 0) return { note: 'N/A', cents: 0 };
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const halfSteps = 12 * Math.log2(frequency / C0);
  const octave = Math.floor(halfSteps / 12);
  const noteIndex = Math.round(halfSteps) % 12;
  const note = notes[noteIndex] + octave;
  
  const exactFrequency = C0 * Math.pow(2, Math.floor(halfSteps) / 12);
  const cents = 1200 * Math.log2(frequency / exactFrequency);
  
  return { note, cents };
}

// Calibration points: [measured, actual]
const calibrationPoints = [
  [41, 40],
  [3000, 3000]
];

export function calibrateFrequency(frequency) {
  // Sort calibration points by measured frequency
  const sortedPoints = calibrationPoints.sort((a, b) => a[0] - b[0]);

  // If frequency is below the first calibration point
  if (frequency <= sortedPoints[0][0]) {
    const [x1, y1] = sortedPoints[0];
    return (frequency / x1) * y1;
  }

  // If frequency is above the last calibration point
  if (frequency >= sortedPoints[sortedPoints.length - 1][0]) {
    const [x1, y1] = sortedPoints[sortedPoints.length - 1];
    return (frequency / x1) * y1;
  }

  // Find the two calibration points to interpolate between
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const [x1, y1] = sortedPoints[i];
    const [x2, y2] = sortedPoints[i + 1];

    if (frequency >= x1 && frequency <= x2) {
      // Linear interpolation
      const ratio = (frequency - x1) / (x2 - x1);
      return y1 + ratio * (y2 - y1);
    }
  }

  // This should never happen, but just in case
  return frequency;
}

export function setLabelBackgroundColor(color) {
  labelBackgroundColor = color;
}

export function setLabelTextColor(color) {
  labelTextColor = color;
}

export function setFrequencyLineColor(color) {
  frequencyLineColor = color;
}

export function setPeakBackgroundColor(color) {
  peakBackgroundColor = color;
}