import { analyser, audioContext, bufferLength, dataArray, windowFunction, rmsHistory, rmsDataArray } from './audioSetup.js';
import { applySlopeWeighting, updateRMSHistory, getThresholdValue, getThresholdDb } from './audioProcessing.js';
import { logScale, getNoteWithCents, peakColor, peakBackgroundColor, rmsColor, labelColor, labelBackgroundColor, labelTextColor, frequencyLineColor, calibrateFrequency } from './utils.js';

let smoothedPeaks = [];
let labelPositions = [];
let smoothedLabelPositions = [];

/**
 * Resizes the canvas based on the window size and controls visibility.
 * This function ensures that the canvas always fits the available screen space.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to be resized
 */
export function resizeCanvas(canvas) {
  const controlsContent = document.getElementById('controls-content');
  const isControlsVisible = controlsContent.classList.contains('visible');
  
  canvas.width = window.innerWidth;
  canvas.height = isControlsVisible ? window.innerHeight * 0.7 : window.innerHeight * 0.8;
}

/**
 * Main drawing function that updates and renders the audio visualization.
 * This function is called recursively using requestAnimationFrame to create a smooth animation.
 * It handles canvas resizing, data processing, and calls various drawing functions.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 */
export function draw(ctx, canvas) {
  requestAnimationFrame(() => draw(ctx, canvas));
  
  // Check and update the Canvas size on every frame
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight * 0.8) {
    resizeCanvas(canvas);
  }
  
  if (!rmsHistory) {
    console.error('rmsHistory is not defined');
    return;
  }

  analyser.getByteTimeDomainData(dataArray);
  
  // Apply window function to reduce spectral leakage
  for (let i = 0; i < bufferLength; i++) {
    dataArray[i] *= windowFunction[i];
  }
  
  analyser.getByteFrequencyData(dataArray);
  
  applySlopeWeighting(dataArray, bufferLength);
  updateRMSHistory(dataArray, rmsHistory, rmsDataArray, bufferLength);

  // Clear canvas
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSpectrum(ctx, canvas, dataArray, peakColor, peakBackgroundColor);
  drawSpectrum(ctx, canvas, rmsDataArray, rmsColor);
  const peakFrequencies = findPeaks(rmsDataArray, bufferLength);
  updateSmoothedPeaksAndLabelPositions(peakFrequencies);
  drawLabels(ctx, canvas, smoothedPeaks, labelPositions);
  drawThresholdLine(ctx, canvas);
  drawAverageLine(ctx, canvas);
  drawFrequencyGuide(ctx, canvas);
}

/**
 * Draws the spectrum on the canvas.
 * This function can draw both the instantaneous spectrum and the RMS spectrum.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {Uint8Array} dataArray - The array containing spectrum data
 * @param {string} color - The color to use for the spectrum line
 * @param {string} [backgroundColor] - Optional background color for the spectrum area
 */
function drawSpectrum(ctx, canvas, dataArray, color, backgroundColor) {
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    for (let i = 0; i < bufferLength; i++) {
      const x = logScale(i / bufferLength, bufferLength) * canvas.width;
      const y = canvas.height - (dataArray[i] / 256) * canvas.height;
      if (i === 0) {
        ctx.moveTo(x, canvas.height);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < bufferLength; i++) {
    const x = logScale(i / bufferLength, bufferLength) * canvas.width;
    const y = canvas.height - (dataArray[i] / 256) * canvas.height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

/**
 * Finds peaks in the spectrum data.
 * This function identifies local maxima in the data array that meet certain criteria.
 * 
 * @param {Uint8Array} dataArray - The array containing spectrum data
 * @param {number} bufferLength - The length of the data array
 * @returns {Array<Object>} An array of peak objects, each containing an index and value
 */
function findPeaks(dataArray, bufferLength) {
  let peaks = [];
  const minPeakHeight = 5; // Reduce minimum height if needed
  const minPeakDistance = 2; // Reduce minimum distance if needed

  for (let i = 1; i < bufferLength - 1; i++) {
    if (dataArray[i] > minPeakHeight &&
        dataArray[i] > dataArray[i - 1] && 
        dataArray[i] > dataArray[i + 1]) {
      
      if (peaks.length === 0 || i - peaks[peaks.length - 1].index > minPeakDistance) {
        peaks.push({ index: i, value: dataArray[i] });
      } else if (dataArray[i] > peaks[peaks.length - 1].value) {
        peaks[peaks.length - 1] = { index: i, value: dataArray[i] };
      }
    }
  }
  return peaks.sort((a, b) => b.value - a.value).slice(0, 12);
}

/**
 * Updates the smoothed peaks and label positions.
 * This function provides a smooth transition for peak positions and labels,
 * preventing abrupt changes in the visualization.
 * 
 * @param {Array<Object>} peakFrequencies - The current peak frequencies detected
 */
function updateSmoothedPeaksAndLabelPositions(peakFrequencies) {
  if (smoothedPeaks.length === 0) {
    smoothedPeaks = peakFrequencies.map(peak => ({ ...peak }));
    smoothedLabelPositions = peakFrequencies.map(peak => logScale(peak.index / bufferLength, bufferLength));
  } else {
    smoothedPeaks = peakFrequencies.map((peak, i) => {
      const smoothedPeak = smoothedPeaks[i] || { index: peak.index, value: 0 };
      return {
        index: peak.index,
        value: peak.value
      };
    });
    smoothedLabelPositions = smoothedLabelPositions.map((pos, i) => {
      const targetPos = peakFrequencies[i] ? logScale(peakFrequencies[i].index / bufferLength, bufferLength) : pos;
      return pos * 0.95 + targetPos * 0.05;
    });
  }
}

/**
 * Sorts peaks based on their amplitude.
 * This function is used to determine which peaks should be labeled.
 * 
 * @param {Array<Object>} smoothedPeaks - The array of smoothed peak objects
 * @param {Array<number>} labelPositions - The array of label positions
 * @returns {Array<Object>} Sorted array of peak objects with label positions
 */
function sortPeaks(smoothedPeaks, labelPositions) {
  return smoothedPeaks
    .map((peak, index) => ({ ...peak, labelPosition: labelPositions[index] }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Interpolates the exact frequency of a peak.
 * This function improves frequency resolution by interpolating between FFT bins.
 * 
 * @param {Object} peak - The peak object containing index and value
 * @param {Uint8Array} dataArray - The array containing spectrum data
 * @param {number} sampleRate - The sample rate of the audio context
 * @param {number} fftSize - The FFT size used in the analysis
 * @returns {number} The interpolated frequency
 */
function interpolateFrequency(peak, dataArray, sampleRate, fftSize) {
  const leftValue = dataArray[peak.index - 1] || 0;
  const rightValue = dataArray[peak.index + 1] || 0;
  const delta = (rightValue - leftValue) / (2 * (2 * peak.value - leftValue - rightValue));
  const interpolatedIndex = peak.index + delta;
  return interpolatedIndex * sampleRate / fftSize;
}

/**
 * Draws labels for the detected peaks.
 * This function handles the rendering of frequency labels and their connecting lines.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {Array<Object>} smoothedPeaks - The array of smoothed peak objects
 * @param {Array<number>} labelPositions - The array of label positions
 */
function drawLabels(ctx, canvas, smoothedPeaks, labelPositions) {
  ctx.font = '12px Arial';
  const thresholdValue = getThresholdValue();
  const sortedPeaks = sortPeaks(smoothedPeaks, smoothedLabelPositions);
 
  // Select only peaks above the threshold
  const labelsToShow = sortedPeaks.filter(peak => peak.value > thresholdValue).slice(0, 4);
  labelsToShow.forEach((peak, index) => {
    drawSingleLabel(ctx, canvas, peak, index, thresholdValue);
  });
}

/**
 * Draws a single label for a peak.
 * This function handles the rendering of a single frequency label, its background, and connecting line.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {Object} peak - The peak object to label
 * @param {number} index - The index of the peak in the sorted array
 * @param {number} thresholdValue - The current threshold value
 */
function drawSingleLabel(ctx, canvas, peak, index, thresholdValue) {
  let frequency = interpolateFrequency(peak, rmsDataArray, audioContext.sampleRate, analyser.fftSize);
  frequency = calibrateFrequency(frequency);
  const { note, cents } = getNoteWithCents(frequency);
  const labelX = peak.labelPosition * canvas.width;
  const labelY = 20 + index * 20;

  const labelText = `${frequency.toFixed(1)}Hz ${note} ${cents >= 0 ? '+' : ''}${cents.toFixed(0)}¢`;
  const labelWidth = ctx.measureText(labelText).width + 10;

  drawLabelBackground(ctx, labelX, labelY, labelWidth, true);
  drawLabelText(ctx, labelText, labelX, labelY);

  const peakX = logScale(peak.index / bufferLength, bufferLength) * canvas.width;
  const peakY = canvas.height - (peak.value / 255) * canvas.height;
  drawLineToFrequency(ctx, labelX, labelY, peakX, peakY, true);
}

/**
 * Draws the background for a label.
 * This function creates a background rectangle for better label visibility.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {number} labelX - The x-coordinate of the label
 * @param {number} labelY - The y-coordinate of the label
 * @param {number} labelWidth - The width of the label
 * @param {boolean} isAboveThreshold - Whether the peak is above the threshold
 */
function drawLabelBackground(ctx, labelX, labelY, labelWidth, isAboveThreshold) {
  ctx.fillStyle = labelBackgroundColor;
  ctx.fillRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 20);
}

/**
 * Draws the text for a label.
 * This function renders the actual text content of a frequency label.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {string} labelText - The text to be displayed in the label
 * @param {number} labelX - The x-coordinate of the label
 * @param {number} labelY - The y-coordinate of the label
 */
function drawLabelText(ctx, labelText, labelX, labelY) {
  ctx.fillStyle = labelTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, labelX, labelY);
}

/**
 * Draws a line connecting a label to its corresponding frequency peak.
 * This function creates a visual link between the label and the spectrum.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {number} labelX - The x-coordinate of the label
 * @param {number} labelY - The y-coordinate of the label
 * @param {number} peakX - The x-coordinate of the peak on the spectrum
 * @param {number} peakY - The y-coordinate of the peak on the spectrum
 * @param {boolean} isAboveThreshold - Whether the peak is above the threshold
 */
function drawLineToFrequency(ctx, labelX, labelY, peakX, peakY, isAboveThreshold) {
  ctx.beginPath();
  ctx.moveTo(labelX, labelY + 10);
  ctx.lineTo(peakX, peakY);
  ctx.strokeStyle = frequencyLineColor;
  ctx.stroke();
}

/**
 * Draws the threshold line on the canvas.
 * This function visualizes the current threshold level for peak detection.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 */
function drawThresholdLine(ctx, canvas) {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
  ctx.lineWidth = 1;
  const thresholdValue = getThresholdValue();
  // Convert threshold value to canvas Y coordinate
  const thresholdY = canvas.height - (thresholdValue / 255) * canvas.height;
  ctx.moveTo(0, thresholdY);
  ctx.lineTo(canvas.width, thresholdY);
  ctx.stroke();

  // Add a label to show the threshold value in dB
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Threshold: ${getThresholdDb().toFixed(2)} dB`, 10, thresholdY - 5);
}

/**
 * Draws frequency guide lines and labels on the canvas.
 * This function adds reference frequency markers to aid in spectrum interpretation.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 */
function drawFrequencyGuide(ctx, canvas) {
  const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  ctx.fillStyle = labelColor;
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  
  frequencies.forEach(freq => {
    const x = logScale(freq / (audioContext.sampleRate / 2), bufferLength) * canvas.width;
    ctx.fillText(`${freq >= 1000 ? (freq / 1000) + 'k' : freq}Hz`, x, canvas.height - 5);
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 20);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  });
}

/**
 * Draws the average level line on the canvas.
 * This function visualizes the average amplitude level of the spectrum.
 * 
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 */
function drawAverageLine(ctx, canvas) {
  const avgValue = rmsDataArray.reduce((sum, value) => sum + value, 0) / rmsDataArray.length;
  const avgDb = 20 * Math.log10(avgValue / 255);
  
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
  ctx.lineWidth = 1;
  const avgY = canvas.height - (avgValue / 255) * canvas.height;
  ctx.moveTo(0, avgY);
  ctx.lineTo(canvas.width, avgY);
  ctx.stroke();

  // Add a label to show the average value in dB
  ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Avg: ${avgDb.toFixed(2)} dB`, 10, avgY - 5);
}