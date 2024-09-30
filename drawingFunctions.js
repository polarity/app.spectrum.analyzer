import { analyser, audioContext, bufferLength, dataArray, windowFunction, rmsHistory, rmsDataArray } from './audioSetup.js';
import { applySlopeWeighting, updateRMSHistory, getThresholdValue, getThresholdDb } from './audioProcessing.js';
import { logScale, getNoteWithCents, peakColor, rmsColor, labelColor, calibrateFrequency } from './utils.js';

let smoothedPeaks = [];
let labelPositions = [];

export function resizeCanvas(canvas) {
  const controlsContent = document.getElementById('controls-content');
  const isControlsVisible = controlsContent.classList.contains('visible');
  
  canvas.width = window.innerWidth;
  canvas.height = isControlsVisible ? window.innerHeight * 0.7 : window.innerHeight * 0.8;
}


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
  
  // Apply window function
  for (let i = 0; i < bufferLength; i++) {
    dataArray[i] *= windowFunction[i];
  }
  
  analyser.getByteFrequencyData(dataArray);
  
  applySlopeWeighting(dataArray, bufferLength);
  updateRMSHistory(dataArray, rmsHistory, rmsDataArray, bufferLength);

  // Clear canvas
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSpectrum(ctx, canvas, dataArray, peakColor);
  drawSpectrum(ctx, canvas, rmsDataArray, rmsColor);
  const peakFrequencies = findPeaks(rmsDataArray, bufferLength);
  updateSmoothedPeaksAndLabelPositions(peakFrequencies);
  drawLabels(ctx, canvas, smoothedPeaks, labelPositions);
  drawThresholdLine(ctx, canvas);
  drawAverageLine(ctx, canvas);
  drawFrequencyGuide(ctx, canvas);
}

function drawSpectrum(ctx, canvas, dataArray, color) {
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

function updateSmoothedPeaksAndLabelPositions(peakFrequencies) {
  if (smoothedPeaks.length === 0) {
    smoothedPeaks = peakFrequencies.map(peak => ({ ...peak }));
    labelPositions = peakFrequencies.map(peak => logScale(peak.index / bufferLength, bufferLength));
  } else {
    smoothedPeaks = peakFrequencies.map((peak, i) => {
      const smoothedPeak = smoothedPeaks[i] || { index: peak.index, value: 0 };
      return {
        index: smoothedPeak.index * 0.9 + peak.index * 0.1,
        value: smoothedPeak.value * 0.9 + peak.value * 0.1
      };
    });
    labelPositions = peakFrequencies.map((peak, i) => {
      const pos = labelPositions[i] || logScale(peak.index / bufferLength, bufferLength);
      const targetPos = logScale(peak.index / bufferLength, bufferLength);
      return pos * 0.9 + targetPos * 0.1;
    });
  }
}

function sortPeaks(smoothedPeaks, labelPositions) {
  return smoothedPeaks
    .map((peak, index) => ({ ...peak, labelPosition: labelPositions[index] }))
    .sort((a, b) => b.value - a.value);
}

function interpolateFrequency(peak, dataArray, sampleRate, fftSize) {
  const leftValue = dataArray[peak.index - 1] || 0;
  const rightValue = dataArray[peak.index + 1] || 0;
  const delta = (rightValue - leftValue) / (2 * (2 * peak.value - leftValue - rightValue));
  const interpolatedIndex = peak.index + delta;
  return interpolatedIndex * sampleRate / fftSize;
}

function drawLabels(ctx, canvas, smoothedPeaks, labelPositions) {
  ctx.font = '12px Arial';
  const thresholdValue = getThresholdValue();
  const sortedPeaks = sortPeaks(smoothedPeaks, labelPositions);
 
  // Select only peaks above the threshold
  const labelsToShow = sortedPeaks.filter(peak => peak.value > thresholdValue).slice(0, 4);
  labelsToShow.forEach((peak, index) => {
    drawSingleLabel(ctx, canvas, peak, index, thresholdValue);
  });
}


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

function drawLabelBackground(ctx, labelX, labelY, labelWidth, isAboveThreshold) {
  ctx.fillStyle = isAboveThreshold ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
  ctx.fillRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 20);
}

function drawLabelText(ctx, labelText, labelX, labelY) {
  ctx.fillStyle = labelColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, labelX, labelY);
}

function drawLineToFrequency(ctx, labelX, labelY, peakX, peakY, isAboveThreshold) {
  ctx.beginPath();
  ctx.moveTo(labelX, labelY + 10);
  ctx.lineTo(peakX, peakY);
  ctx.strokeStyle = isAboveThreshold ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
  ctx.stroke();
}

function drawThresholdLine(ctx, canvas) {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
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

// Check if mediaDevices is available
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // mediaDevices is available
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function(stream) {
            // Stream successfully obtained
            console.log('Media stream obtained:', stream);
        })
        .catch(function(error) {
            // Error obtaining the stream
            console.error('Error accessing media devices:', error);
        });
} else {
    // mediaDevices is not available
    console.error('navigator.mediaDevices is not available');
}