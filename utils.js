export const peakColor = '#ff3232';
export const rmsColor = 'rgba(0, 255, 0, 0.5)';
export const labelColor = '#ffffff';

export function logScale(index, bufferLength) {
  const logmin = Math.log(1);
  const logmax = Math.log(bufferLength);
  const scale = (Math.log(index * (bufferLength - 1) + 1) - logmin) / (logmax - logmin);
  return scale;
}

export function getNoteWithCents(frequency) {
  if (frequency <= 0) return 'N/A';
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = Math.round(12 * (Math.log2(frequency / 440) + 4));
  const octave = Math.floor(noteIndex / 12);
  const note = notes[noteIndex % 12] + octave;
  
  const exactFrequency = 440 * Math.pow(2, (noteIndex - 57) / 12);
  const cents = 1200 * Math.log2(frequency / exactFrequency);
  
  return `${note} (${cents.toFixed(0)} cents)`;
}